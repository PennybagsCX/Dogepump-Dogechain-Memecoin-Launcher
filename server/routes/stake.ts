import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ethers, Contract } from 'ethers';
import postgres from 'postgres';

// ABI for memecoin staking contract
const MEMECOIN_STAKING_ABI = [
  'function stake(address token, uint256 amount)',
  'function unstake(address token, uint256 amount)',
  'function claimRewards(address token)',
  'function getPendingRewards(address user, address token) view returns (uint256)',
  'function getStakeInfo(address user, address token) view returns (uint256 amount, uint256 tokenPrice, uint256 startTime, uint256 pendingRewards, uint256 claimedRewards, bool active)',
  'function getTokenAPY(address token) view returns (uint256)',
  'function getContractStatus() view returns (uint256 totalSupportedTokens, uint256 karmaBalance)',
  'function getSupportedTokens() view returns (address[] memory)',
  'function getTokenConfig(address token) view returns (bool supported, uint256 rewardRate, uint256 minStakeAmount, uint256 maxStakeAmount, uint256 unstakeFeePercent)',
  'function getTotalStaked(address token) view returns (uint256)',
];

// ERC20 ABI for token approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

interface MemecoinStakingContracts {
  stakingContract: Contract;
  karmaToken: Contract;
}

// Load contract addresses from environment
async function loadContracts(provider: ethers.providers.JsonRpcProvider): Promise<MemecoinStakingContracts> {
  const stakingAddress = process.env.MEMECOIN_STAKING_ADDRESS;
  const karmaTokenAddress = process.env.KARMA_TOKEN_ADDRESS;

  if (!stakingAddress || !karmaTokenAddress) {
    throw new Error('Missing contract addresses in environment variables');
  }

  return {
    stakingContract: new Contract(stakingAddress, MEMECOIN_STAKING_ABI, provider),
    karmaToken: new Contract(karmaTokenAddress, ERC20_ABI, provider),
  };
}

// Get user's wallet address from JWT
function getUserWalletAddress(request: FastifyRequest): string {
  const user = (request as any).user;
  if (!user || !user.walletAddress) {
    throw new Error('User wallet address not found');
  }
  return user.walletAddress;
}

// Get Web3 provider
function getProvider(): ethers.providers.JsonRpcProvider {
  const rpcUrl = process.env.DOGECHAIN_MAINNET_RPC || 'https://rpc.dogechain.dog';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

// Get contract signer (for transactions)
async function getSigner(request: FastifyRequest): Promise<ethers.Signer> {
  const privateKey = process.env.BACKEND_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Backend private key not configured');
  }

  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

export default async function memecoinStakeRoutes(fastify: FastifyInstance) {
  // Stake memecoin to earn $KARMA
  fastify.post('/api/stake/memecoin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokenId, amount } = request.body as { tokenId: string; amount: string };

      if (!tokenId || !amount || parseFloat(amount) <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid tokenId or amount',
        });
      }

      const walletAddress = getUserWalletAddress(request);
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get token configuration
      const tokenConfigResult = await pool.query(
        'SELECT * FROM supported_staking_tokens WHERE token_id = $1 AND enabled = TRUE',
        [tokenId]
      );

      if (tokenConfigResult.rows.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Token not supported for staking',
        });
      }

      const tokenConfig = tokenConfigResult.rows[0];

      // Get provider and contracts
      const provider = getProvider();
      const { stakingContract } = await loadContracts(provider);

      // Convert amount to wei (assuming 18 decimals)
      const amountWei = ethers.utils.parseEther(amount);
      const tokenContract = new Contract(tokenConfig.contract_address, ERC20_ABI, provider);

      // Check token balance
      const balance = await tokenContract.balanceOf(walletAddress);
      if (balance.lt(amountWei)) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient token balance',
        });
      }

      // Check allowance
      const allowance = await tokenContract.allowance(walletAddress, stakingContract.address);
      if (allowance.lt(amountWei)) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient allowance. Please approve the staking contract first.',
          requiresApproval: true,
          stakingContract: stakingContract.address,
        });
      }

      // Execute stake transaction
      const signer = await getSigner(request);
      const stakingWithSigner = stakingContract.connect(signer);

      const tx = await stakingWithSigner.stake(tokenConfig.contract_address, amountWei);
      const receipt = await tx.wait();

      // Get transaction details
      const stakeInfo = await stakingContract.getStakeInfo(walletAddress, tokenConfig.contract_address);

      // Save to database
      await pool.query(
        `INSERT INTO memecoin_stakes
         (user_id, token_id, amount, token_price, staked_at, tx_hash)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         ON CONFLICT (user_id, token_id)
         DO UPDATE SET
           amount = memecoin_stakes.amount + EXCLUDED.amount,
           tx_hash = EXCLUDED.tx_hash,
           updated_at = NOW()`,
        [
          (request as any).user.id,
          tokenId,
          amountWei.toString(),
          stakeInfo.tokenPrice.toString(),
          receipt.transactionHash,
        ]
      );

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amount: amountWei.toString(),
          formattedAmount: amount,
          stakeInfo: {
            amount: stakeInfo.amount.toString(),
            pendingRewards: stakeInfo.pendingRewards.toString(),
            claimedRewards: stakeInfo.claimedRewards.toString(),
          },
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Unstake memecoin
  fastify.post('/api/stake/memecoin/unstake', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { stakeId, amount } = request.body as { stakeId: string; amount: string };

      if (!stakeId || !amount || parseFloat(amount) <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid stakeId or amount',
        });
      }

      const walletAddress = getUserWalletAddress(request);
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get stake record
      const stakeResult = await pool.query(
        'SELECT * FROM memecoin_stakes WHERE id = $1 AND user_id = $2 AND active = TRUE',
        [stakeId, (request as any).user.id]
      );

      if (stakeResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Stake not found',
        });
      }

      const stake = stakeResult.rows[0];

      // Get token configuration
      const tokenConfigResult = await pool.query(
        'SELECT * FROM supported_staking_tokens WHERE token_id = $1',
        [stake.token_id]
      );

      if (tokenConfigResult.rows.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Token configuration not found',
        });
      }

      const tokenConfig = tokenConfigResult.rows[0];

      // Check if amount is valid
      const stakedAmount = BigInt(stake.amount);
      const unstakeAmount = ethers.utils.parseEther(amount);

      if (unstakeAmount > stakedAmount) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient staked amount',
        });
      }

      // Execute unstake transaction
      const provider = getProvider();
      const { stakingContract } = await loadContracts(provider);
      const signer = await getSigner(request);
      const stakingWithSigner = stakingContract.connect(signer);

      const tx = await stakingWithSigner.unstake(tokenConfig.contract_address, unstakeAmount);
      const receipt = await tx.wait();

      // Update database
      const newStakedAmount = stakedAmount - unstakeAmount;
      const isActive = newStakedAmount > 0;

      await pool.query(
        `UPDATE memecoin_stakes
         SET
           amount = $1,
           active = $2,
           unstaked_at = CASE WHEN $2 = FALSE THEN NOW() ELSE NULL END,
           unstake_amount = COALESCE(unstake_amount, 0) + $3,
           tx_hash = $4,
           updated_at = NOW()
         WHERE id = $5`,
        [
          newStakedAmount.toString(),
          isActive,
          unstakeAmount.toString(),
          receipt.transactionHash,
          stakeId,
        ]
      );

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amount: unstakeAmount.toString(),
          formattedAmount: amount,
          remainingStaked: newStakedAmount.toString(),
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Claim $KARMA rewards
  fastify.post('/api/stake/memecoin/claim', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokenId } = request.body as { tokenId: string };

      if (!tokenId) {
        return reply.code(400).send({
          success: false,
          error: 'TokenId is required',
        });
      }

      const walletAddress = getUserWalletAddress(request);
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get user's stake for this token
      const stakeResult = await pool.query(
        'SELECT * FROM memecoin_stakes WHERE user_id = $1 AND token_id = $2 AND active = TRUE',
        [(request as any).user.id, tokenId]
      );

      if (stakeResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'No active stake found for this token',
        });
      }

      const stake = stakeResult.rows[0];

      // Get token configuration
      const tokenConfigResult = await pool.query(
        'SELECT * FROM supported_staking_tokens WHERE token_id = $1',
        [tokenId]
      );

      if (tokenConfigResult.rows.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Token configuration not found',
        });
      }

      const tokenConfig = tokenConfigResult.rows[0];

      // Execute claim transaction
      const provider = getProvider();
      const { stakingContract } = await loadContracts(provider);
      const signer = await getSigner(request);
      const stakingWithSigner = stakingContract.connect(signer);

      const tx = await stakingWithSigner.claimRewards(tokenConfig.contract_address);
      const receipt = await tx.wait();

      // Get updated stake info
      const stakeInfo = await stakingContract.getStakeInfo(walletAddress, tokenConfig.contract_address);
      const claimedAmount = stakeInfo.claimedRewards.toString();

      // Update database
      await pool.query(
        `UPDATE memecoin_stakes
         SET
           claimed_karma = $1,
           pending_karma = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [claimedAmount, stakeInfo.pendingRewards.toString(), stake.id]
      );

      // Record reward claim
      await pool.query(
        `INSERT INTO memecoin_rewards_claimed
         (user_id, stake_id, token_id, amount, tx_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [(request as any).user.id, stake.id, tokenId, claimedAmount, receipt.transactionHash]
      );

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amountClaimed: claimedAmount,
          formattedAmountClaimed: ethers.utils.formatEther(claimedAmount),
          remainingPending: ethers.utils.formatEther(stakeInfo.pendingRewards),
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get user's memecoin staking positions
  fastify.get('/api/stake/memecoin/positions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      const result = await pool.query(
        `SELECT
          ms.*,
          st.token_symbol,
          st.reward_rate,
          st.unstake_fee_percent,
          (SELECT COUNT(*) FROM memecoin_stakes ms2 WHERE ms2.token_id = ms.token_id AND ms2.active = TRUE) as total_stakers
         FROM memecoin_stakes ms
         LEFT JOIN supported_staking_tokens st ON st.token_id = ms.token_id
         WHERE ms.user_id = $1 AND ms.active = TRUE
         ORDER BY ms.staked_at DESC`,
        [(request as any).user.id]
      );

      const positions = result.rows.map(row => ({
        id: row.id,
        tokenId: row.token_id,
        tokenSymbol: row.token_symbol,
        amount: row.amount,
        formattedAmount: ethers.utils.formatEther(row.amount),
        tokenPrice: row.token_price,
        stakedAt: row.staked_at,
        pendingKarma: row.pending_karma,
        formattedPendingKarma: ethers.utils.formatEther(row.pending_karma),
        claimedKarma: row.claimed_karma,
        formattedClaimedKarma: ethers.utils.formatEther(row.claimed_karma),
        rewardRate: row.reward_rate,
        unstakeFeePercent: row.unstake_fee_percent,
        totalStakers: parseInt(row.total_stakers),
      }));

      return {
        success: true,
        data: {
          positions,
          count: positions.length,
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get staking info for a specific token
  fastify.get('/api/stake/memecoin/:tokenId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokenId } = request.params as { tokenId: string };

      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get token configuration
      const tokenConfigResult = await pool.query(
        'SELECT * FROM supported_staking_tokens WHERE token_id = $1',
        [tokenId]
      );

      if (tokenConfigResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Token not found or not supported for staking',
        });
      }

      const tokenConfig = tokenConfigResult.rows[0];

      // Get total staked for this token
      const totalStakedResult = await pool.query(
        'SELECT SUM(amount) as total_staked, COUNT(*) as staker_count FROM memecoin_stakes WHERE token_id = $1 AND active = TRUE',
        [tokenId]
      );

      const totalStaked = totalStakedResult.rows[0].total_staked || '0';
      const stakerCount = totalStakedResult.rows[0].staker_count || 0;

      // Get user's stake for this token (if authenticated)
      let userStake = null;
      let pendingRewards = '0';

      if ((request as any).user) {
        const userStakeResult = await pool.query(
          'SELECT * FROM memecoin_stakes WHERE user_id = $1 AND token_id = $2 AND active = TRUE',
          [(request as any).user.id, tokenId]
        );

        if (userStakeResult.rows.length > 0) {
          userStake = userStakeResult.rows[0];
          pendingRewards = userStake.pending_karma;
        }
      }

      // Calculate APY
      const rewardRate = parseInt(tokenConfig.reward_rate);
      const apyBasisPoints = rewardRate * 365; // Annualize daily rate

      return {
        success: true,
        data: {
          tokenId: tokenConfig.token_id,
          tokenSymbol: tokenConfig.token_symbol,
          rewardRate: tokenConfig.reward_rate,
          minStakeAmount: tokenConfig.min_stake_amount,
          maxStakeAmount: tokenConfig.max_stake_amount,
          unstakeFeePercent: tokenConfig.unstake_fee_percent,
          enabled: tokenConfig.enabled,
          totalStaked,
          formattedTotalStaked: ethers.utils.formatEther(totalStaked),
          stakerCount,
          apyBasisPoints,
          formattedAPY: `${apyBasisPoints / 100}%`,
          userStake: userStake ? {
            amount: userStake.amount,
            formattedAmount: ethers.utils.formatEther(userStake.amount),
            pendingRewards,
            formattedPendingRewards: ethers.utils.formatEther(pendingRewards),
            claimedRewards: userStake.claimed_karma,
            formattedClaimedRewards: ethers.utils.formatEther(userStake.claimed_karma),
            stakedAt: userStake.staked_at,
          } : null,
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get all supported staking tokens
  fastify.get('/api/stake/supported-tokens', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      const result = await pool.query(
        'SELECT * FROM supported_staking_tokens WHERE enabled = TRUE ORDER BY reward_rate DESC'
      );

      const tokens = result.rows.map(row => ({
        tokenId: row.token_id,
        tokenSymbol: row.token_symbol,
        rewardRate: row.reward_rate,
        minStakeAmount: row.min_stake_amount,
        maxStakeAmount: row.max_stake_amount,
        unstakeFeePercent: row.unstake_fee_percent,
        contractAddress: row.contract_address,
        apyBasisPoints: parseInt(row.reward_rate) * 365,
        formattedAPY: `${(parseInt(row.reward_rate) * 365 / 100).toFixed(2)}%`,
      }));

      return {
        success: true,
        data: {
          tokens,
          count: tokens.length,
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Approve memecoin for staking
  fastify.post('/api/stake/memecoin/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokenId } = request.body as { tokenId: string };

      if (!tokenId) {
        return reply.code(400).send({
          success: false,
          error: 'TokenId is required',
        });
      }

      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get token configuration
      const tokenConfigResult = await pool.query(
        'SELECT contract_address FROM supported_staking_tokens WHERE token_id = $1',
        [tokenId]
      );

      if (tokenConfigResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Token not found',
        });
      }

      const tokenConfig = tokenConfigResult.rows[0];

      // Get staking contract address
      const stakingAddress = process.env.MEMECOIN_STAKING_ADDRESS;
      if (!stakingAddress) {
        throw new Error('MEMECOIN_STAKING_ADDRESS not configured');
      }

      // Approve max amount
      const provider = getProvider();
      const tokenContract = new Contract(tokenConfig.contract_address, ERC20_ABI, provider);
      const signer = await getSigner(request);

      const maxAmount = ethers.constants.MaxUint256;
      const tokenWithSigner = tokenContract.connect(signer);

      const tx = await tokenWithSigner.approve(stakingAddress, maxAmount);
      const receipt = await tx.wait();

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          approvedAmount: maxAmount.toString(),
          status: receipt.status === 1 ? 'success' : 'failed',
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get global memecoin staking stats
  fastify.get('/api/stake/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      // Get overall stats
      const statsResult = await pool.query(
        `SELECT
          COUNT(DISTINCT user_id) as total_stakers,
          COUNT(DISTINCT token_id) as total_tokens,
          SUM(amount) as total_staked
         FROM memecoin_stakes
         WHERE active = TRUE`
      );

      // Get rewards claimed stats
      const rewardsResult = await pool.query(
        `SELECT
          COUNT(*) as total_claims,
          SUM(amount) as total_claimed
         FROM memecoin_rewards_claimed`
      );

      return {
        success: true,
        data: {
          totalStakers: parseInt(statsResult.rows[0].total_stakers) || 0,
          totalTokens: parseInt(statsResult.rows[0].total_tokens) || 0,
          totalStaked: statsResult.rows[0].total_staked || '0',
          formattedTotalStaked: ethers.utils.formatEther(statsResult.rows[0].total_staked || '0'),
          totalClaims: parseInt(rewardsResult.rows[0].total_claims) || 0,
          totalClaimed: rewardsResult.rows[0].total_claimed || '0',
          formattedTotalClaimed: ethers.utils.formatEther(rewardsResult.rows[0].total_claimed || '0'),
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
