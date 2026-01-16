import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ethers, Contract } from 'ethers';

// ABI fragments for contract interactions
const KARMA_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getTokenDetails() view returns (string name, string symbol, uint256 supply, uint256 maxSupply, uint256 remaining, bool mintingActive)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function getStakeInfo(address user) view returns (uint256 amount, uint256 rewardsClaimed, uint256 pendingRewards, uint256 bonusMultiplier, uint256 stakeSeconds)',
  'function calculateCurrentAPY() view returns (uint256)',
  'function getContractStats() view returns (uint256 totalStaked, uint256 totalRewardsDistributed, uint256 totalStakers, uint256 currentAPY)',
];

const KARMA_STAKING_ABI = [
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function getPendingRewards(address user) view returns (uint256)',
  'function getStakeInfo(address user) view returns (uint256 amount, uint256 rewardsClaimed, uint256 pendingRewards, uint256 bonusMultiplier, uint256 stakeSeconds)',
  'function calculateCurrentAPY() view returns (uint256)',
  'function getContractStats() view returns (uint256 totalStaked, uint256 totalRewardsDistributed, uint256 totalStakers, uint256 currentAPY)',
  'function launchTimestamp() view returns (uint256)',
];

const KARMA_BUYBACK_ABI = [
  'function getStatus() view returns (bool buybackEnabled, uint256 lastBuybackTime, address stakingContract, uint256 karmaBalance, uint256 feeBalance)',
  'function executeBuyback(uint256 feeAmount, uint256 minKarmaOut) returns (uint256)',
  'function setBuybackEnabled(bool enabled)',
];

const FEE_COLLECTOR_ABI = [
  'function getBuybackFees() view returns (uint256)',
  'function buybackContract() view returns (address)',
];

// DEX Router ABI for price queries
const DEX_ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] amounts)',
];

interface KarmaContracts {
  karmaToken: Contract;
  karmaStaking: Contract;
  karmaBuyback: Contract;
  feeCollector: Contract;
  dexRouter: Contract;
}

// Load contract addresses from environment or deployment file
async function loadContracts(provider: ethers.providers.JsonRpcProvider): Promise<KarmaContracts> {
  const karmaTokenAddress = process.env.KARMA_TOKEN_ADDRESS;
  const karmaStakingAddress = process.env.KARMA_STAKING_ADDRESS;
  const karmaBuybackAddress = process.env.KARMA_BUYBACK_ADDRESS;
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS;
  const dexRouterAddress = process.env.DOGEPUMP_ROUTER;

  if (!karmaTokenAddress || !karmaStakingAddress || !karmaBuybackAddress ||
      !feeCollectorAddress || !dexRouterAddress) {
    throw new Error('Missing contract addresses in environment variables');
  }

  return {
    karmaToken: new Contract(karmaTokenAddress, KARMA_TOKEN_ABI, provider),
    karmaStaking: new Contract(karmaStakingAddress, KARMA_STAKING_ABI, provider),
    karmaBuyback: new Contract(karmaBuybackAddress, KARMA_BUYBACK_ABI, provider),
    feeCollector: new Contract(feeCollectorAddress, FEE_COLLECTOR_ABI, provider),
    dexRouter: new Contract(dexRouterAddress, DEX_ROUTER_ABI, provider),
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

// Get contract signer (for transactions that require signature)
async function getSigner(request: FastifyRequest): Promise ethers.Signer {
  const walletAddress = getUserWalletAddress(request);

  // In production, this would use the user's signature to create a signer
  // For now, we'll use a backend signer (you should implement proper wallet connection)
  const privateKey = process.env.BACKEND_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Backend private key not configured');
  }

  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

export default async function karmaRoutes(fastify: FastifyInstance) {
  // Get user's $KARMA balance
  fastify.get('/api/karma/balance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const walletAddress = getUserWalletAddress(request);
      const provider = getProvider();
      const { karmaToken } = await loadContracts(provider);

      const balance = await karmaToken.balanceOf(walletAddress);
      const totalSupply = await karmaToken.totalSupply();

      return {
        success: true,
        data: {
          walletAddress,
          balance: balance.toString(),
          formattedBalance: ethers.utils.formatEther(balance),
          totalSupply: totalSupply.toString(),
          formattedTotalSupply: ethers.utils.formatEther(totalSupply),
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

  // Get staking info for a user
  fastify.get('/api/karma/stake-info', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const walletAddress = getUserWalletAddress(request);
      const provider = getProvider();
      const { karmaStaking, karmaToken } = await loadContracts(provider);

      const stakeInfo = await karmaStaking.getStakeInfo(walletAddress);
      const karmaBalance = await karmaToken.balanceOf(walletAddress);

      // Calculate bonus multiplier end time
      const launchTimestamp = await karmaStaking.launchTimestamp();
      const bonusPeriod1End = launchTimestamp.add(30 * 24 * 60 * 60); // 30 days
      const bonusPeriod2End = launchTimestamp.add(90 * 24 * 60 * 60); // 90 days

      const now = Math.floor(Date.now() / 1000);
      let bonusMultiplier = 100; // 1x
      let bonusLabel = 'Normal';

      if (stakeInfo.bonusMultiplier.toNumber() === 200) {
        bonusMultiplier = 200;
        bonusLabel = '2x Early Adopter';
      } else if (stakeInfo.bonusMultiplier.toNumber() === 150) {
        bonusMultiplier = 150;
        bonusLabel = '1.5x Bonus';
      }

      return {
        success: true,
        data: {
          walletAddress,
          stakedAmount: stakeInfo.amount.toString(),
          formattedStakedAmount: ethers.utils.formatEther(stakeInfo.amount),
          rewardsClaimed: stakeInfo.rewardsClaimed.toString(),
          formattedRewardsClaimed: ethers.utils.formatEther(stakeInfo.rewardsClaimed),
          pendingRewards: stakeInfo.pendingRewards.toString(),
          formattedPendingRewards: ethers.utils.formatEther(stakeInfo.pendingRewards),
          bonusMultiplier: stakeInfo.bonusMultiplier.toNumber(),
          bonusLabel,
          stakeSeconds: stakeInfo.stakeSeconds.toString(),
          availableBalance: karmaBalance.toString(),
          formattedAvailableBalance: ethers.utils.formatEther(karmaBalance),
          bonusPeriod1End: bonusPeriod1End.toNumber(),
          bonusPeriod2End: bonusPeriod2End.toNumber(),
          currentTime: now,
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

  // Stake $KARMA tokens
  fastify.post('/api/karma/stake', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { amount } = request.body as { amount: string };

      if (!amount || parseFloat(amount) <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid amount',
        });
      }

      const walletAddress = getUserWalletAddress(request);
      const provider = getProvider();
      const { karmaStaking, karmaToken } = await loadContracts(provider);
      const signer = await getSigner(request);

      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount);

      // Check allowance
      const allowance = await karmaToken.allowance(walletAddress, karmaStaking.address);
      if (allowance.lt(amountWei)) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient allowance. Please approve $KARMA staking first.',
          requiresApproval: true,
        });
      }

      // Check balance
      const balance = await karmaToken.balanceOf(walletAddress);
      if (balance.lt(amountWei)) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient $KARMA balance',
        });
      }

      // Execute stake transaction
      const stakingWithSigner = karmaStaking.connect(signer);
      const tx = await stakingWithSigner.stake(amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amount: amountWei.toString(),
          formattedAmount: amount,
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

  // Unstake $KARMA tokens
  fastify.post('/api/karma/unstake', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { amount } = request.body as { amount: string };

      if (!amount || parseFloat(amount) <= 0) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid amount',
        });
      }

      const provider = getProvider();
      const { karmaStaking } = await loadContracts(provider);
      const signer = await getSigner(request);
      const walletAddress = getUserWalletAddress(request);

      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount);

      // Check if user has enough staked
      const stakeInfo = await karmaStaking.getStakeInfo(walletAddress);
      if (stakeInfo.amount.lt(amountWei)) {
        return reply.code(400).send({
          success: false,
          error: 'Insufficient staked amount',
        });
      }

      // Execute unstake transaction
      const stakingWithSigner = karmaStaking.connect(signer);
      const tx = await stakingWithSigner.unstake(amountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amount: amountWei.toString(),
          formattedAmount: amount,
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

  // Claim staking rewards
  fastify.post('/api/karma/claim-rewards', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = getProvider();
      const { karmaStaking } = await loadContracts(provider);
      const signer = await getSigner(request);
      const walletAddress = getUserWalletAddress(request);

      // Check if user has pending rewards
      const pendingRewards = await karmaStaking.getPendingRewards(walletAddress);
      if (pendingRewards.isZero()) {
        return reply.code(400).send({
          success: false,
          error: 'No pending rewards to claim',
        });
      }

      // Execute claim transaction
      const stakingWithSigner = karmaStaking.connect(signer);
      const tx = await stakingWithSigner.claimRewards();
      const receipt = await tx.wait();

      return {
        success: true,
        data: {
          transactionHash: receipt.transactionHash,
          amountClaimed: pendingRewards.toString(),
          formattedAmountClaimed: ethers.utils.formatEther(pendingRewards),
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

  // Get global $KARMA stats
  fastify.get('/api/karma/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = getProvider();
      const { karmaStaking, karmaToken, karmaBuyback, feeCollector } = await loadContracts(provider);

      // Get staking stats
      const stats = await karmaStaking.getContractStats();

      // Get token details
      const tokenDetails = await karmaToken.getTokenDetails();

      // Get buyback status
      const buybackStatus = await karmaBuyback.getStatus();

      // Get buyback fees available
      const buybackFees = await feeCollector.getBuybackFees();

      // Calculate current token price from DEX (simplified)
      // In production, you'd use a proper price oracle
      const tokenPrice = 0.0000001; // Placeholder

      return {
        success: true,
        data: {
          token: {
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            totalSupply: tokenDetails.supply.toString(),
            formattedTotalSupply: ethers.utils.formatEther(tokenDetails.supply),
            maxSupply: tokenDetails.maxSupply,
            remainingSupply: tokenDetails.remaining.toString(),
            formattedRemainingSupply: ethers.utils.formatEther(tokenDetails.remaining),
            mintingActive: tokenDetails.mintingActive,
            price: tokenPrice,
          },
          staking: {
            totalStaked: stats.totalStaked.toString(),
            formattedTotalStaked: ethers.utils.formatEther(stats.totalStaked),
            totalRewardsDistributed: stats.totalRewardsDistributed.toString(),
            formattedTotalRewardsDistributed: ethers.utils.formatEther(stats.totalRewardsDistributed),
            totalStakers: stats.totalStakers.toString(),
            currentAPY: stats.currentAPY.toString(),
            formattedAPY: (stats.currentAPY.toNumber() / 100).toFixed(2) + '%',
          },
          buyback: {
            enabled: buybackStatus.buybackEnabled,
            lastBuybackTime: buybackStatus.lastBuybackTime.toString(),
            karmaBalance: buybackStatus.karmaBalance.toString(),
            formattedKarmaBalance: ethers.utils.formatEther(buybackStatus.karmaBalance),
            feeBalance: buybackStatus.feeBalance.toString(),
            formattedFeeBalance: ethers.utils.formatEther(buybackStatus.feeBalance),
            availableFees: buybackFees.toString(),
            formattedAvailableFees: ethers.utils.formatEther(buybackFees),
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

  // Get APY history (for chart display)
  fastify.get('/api/karma/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = '30' } = request.query as { limit?: string };

      // For now, return placeholder data
      // In production, you'd query the database for historical APY data
      const history = [];
      const now = Date.now();

      for (let i = parseInt(limit); i > 0; i--) {
        const timestamp = now - i * 24 * 60 * 60 * 1000; // i days ago
        history.push({
          timestamp,
          date: new Date(timestamp).toISOString().split('T')[0],
          apy: Math.random() * 5000 + 1000, // Random APY between 10% and 60%
          totalStaked: Math.random() * 1000000 + 100000,
        });
      }

      return {
        success: true,
        data: {
          history,
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

  // Get buyback history
  fastify.get('/api/karma/buybacks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = '10', offset = '0' } = request.query as { limit?: string; offset?: string };

      // Query database for buyback history using the existing pool
      const { getPool } = await import('../database/db.js');
      const pool = getPool();

      const result = await pool.query(
        `SELECT
          id,
          executed_at,
          fees_collected,
          karma_bought,
          price,
          tx_hash
        FROM karma_buybacks
        ORDER BY executed_at DESC
        LIMIT $1
        OFFSET $2`,
        [parseInt(limit), parseInt(offset)]
      );

      return {
        success: true,
        data: {
          buybacks: result.rows,
          count: result.rows.length,
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

  // Approve $KARMA for staking
  fastify.post('/api/karma/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = getProvider();
      const { karmaStaking, karmaToken } = await loadContracts(provider);
      const signer = await getSigner(request);

      // Approve max amount
      const maxAmount = ethers.constants.MaxUint256;
      const tokenWithSigner = karmaToken.connect(signer);
      const tx = await tokenWithSigner.approve(karmaStaking.address, maxAmount);
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

  // Get current $KARMA price from DEX
  fastify.get('/api/karma/price', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const provider = getProvider();
      const { karmaToken, dexRouter } = await loadContracts(provider);
      const dcTokenAddress = process.env.DC_TOKEN;

      if (!dcTokenAddress) {
        throw new Error('DC_TOKEN address not configured');
      }

      // Get price using DEX router (1 $KARMA in terms of $DC)
      const path = [karmaToken.address, dcTokenAddress];
      const amountIn = ethers.utils.parseEther('1');
      const amounts = await dexRouter.getAmountsOut(amountIn, path);

      const priceInDC = ethers.utils.formatEther(amounts[1]);

      return {
        success: true,
        data: {
          priceInDC,
          priceInUSD: parseFloat(priceInDC) * 0.01, // Assuming $DC = $0.01
          timestamp: Date.now(),
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
