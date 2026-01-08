/**
 * Blockchain API Routes
 * Provides endpoints for blockchain interactions
 */

import { FastifyInstance } from 'fastify';
import {
  isValidAddress,
  getNativeBalance,
  getDCBalance,
  verifySufficientBalance,
  getTokenInfo,
  formatTokenAmount,
} from '../services/blockchainService.js';
import { logger } from '../utils/logger.js';

async function blockchainRoutes(fastify: FastifyInstance) {
  // Health check for blockchain service
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'blockchain',
      timestamp: new Date().toISOString(),
    };
  });

  // Validate address format
  fastify.get('/validate/:address', {
    schema: {
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    const { address } = request.params as { address: string };

    if (!address) {
      return reply.code(400).send({
        error: 'Address is required',
      });
    }

    const valid = isValidAddress(address);

    return {
      address,
      valid,
    };
  });

  // Get native DOGE balance
  fastify.get('/balance/native/:address', {
    schema: {
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    const { address } = request.params as { address: string };

    if (!address) {
      return reply.code(400).send({
        error: 'Address is required',
      });
    }

    try {
      const balance = await getNativeBalance(address);
      const balanceInEth = formatTokenAmount(balance, 18); // DOGE uses 18 decimals

      logger.info(`Fetched native balance for ${address}: ${balanceInEth} DOGE`);

      return {
        address,
        balance: balance.toString(),
        balanceInEth,
        decimals: 18,
      };
    } catch (error) {
      logger.error(error, 'Error fetching native balance:');
      return reply.code(500).send({
        error: 'Failed to fetch native balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get DC token balance
  fastify.get('/balance/dc/:address', {
    schema: {
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    const { address } = request.params as { address: string };

    if (!address) {
      return reply.code(400).send({
        error: 'Address is required',
      });
    }

    try {
      const balance = await getDCBalance(address);
      const balanceFormatted = formatTokenAmount(balance, 18);

      logger.info(`Fetched DC balance for ${address}: ${balanceFormatted} DC`);

      return {
        address,
        balance: balance.toString(),
        balanceFormatted,
        decimals: 18,
      };
    } catch (error) {
      logger.error(error, 'Error fetching DC balance:');
      return reply.code(500).send({
        error: 'Failed to fetch DC balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get both balances (native + DC)
  fastify.get('/balance/all/:address', {
    schema: {
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    const { address } = request.params as { address: string };

    if (!address) {
      return reply.code(400).send({
        error: 'Address is required',
      });
    }

    try {
      const [nativeBalance, dcBalance] = await Promise.all([
        getNativeBalance(address),
        getDCBalance(address),
      ]);

      const nativeFormatted = formatTokenAmount(nativeBalance, 18);
      const dcFormatted = formatTokenAmount(dcBalance, 18);

      logger.info(`Fetched all balances for ${address}: ${nativeFormatted} DOGE, ${dcFormatted} DC`);

      return {
        address,
        native: {
          balance: nativeBalance.toString(),
          formatted: nativeFormatted,
          decimals: 18,
        },
        dc: {
          balance: dcBalance.toString(),
          formatted: dcFormatted,
          decimals: 18,
        },
      };
    } catch (error) {
      logger.error(error, 'Error fetching balances:');
      return reply.code(500).send({
        error: 'Failed to fetch balances',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Verify sufficient balance for token launch
  fastify.post('/verify-balance', {
    schema: {
      body: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          requiredDC: { type: 'string' },
        },
        required: ['address', 'requiredDC'],
      },
    },
  }, async (request, reply) => {
    const { address, requiredDC } = request.body as {
      address: string;
      requiredDC: string;
    };

    if (!address || !requiredDC) {
      return reply.code(400).send({
        error: 'Address and requiredDC are required',
      });
    }

    try {
      const requiredDCBigInt = BigInt(requiredDC);

      if (requiredDCBigInt < 0n) {
        return reply.code(400).send({
          error: 'Required DC cannot be negative',
        });
      }

      const result = await verifySufficientBalance(address, requiredDCBigInt);

      logger.info(
        `Balance verification for ${address}: Required ${formatTokenAmount(requiredDC, 18)} DC, Have ${formatTokenAmount(result.dcBalance, 18)} DC, Sufficient: ${result.sufficient}`
      );

      return {
        ...result,
        dcBalanceFormatted: formatTokenAmount(result.dcBalance, 18),
        requiredDCFormatted: formatTokenAmount(result.requiredDC, 18),
      };
    } catch (error) {
      logger.error(error, 'Error verifying balance:');
      return reply.code(500).send({
        error: 'Failed to verify balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get DC token info
  fastify.get('/token/info', async (request, reply) => {
    try {
      const tokenInfo = await getTokenInfo();

      logger.info('Fetched DC token info');

      return {
        address: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
        ...tokenInfo,
        totalSupplyFormatted: formatTokenAmount(tokenInfo.totalSupply, tokenInfo.decimals),
      };
    } catch (error) {
      logger.error(error, 'Error fetching token info:');
      return reply.code(500).send({
        error: 'Failed to fetch token info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export default blockchainRoutes;
