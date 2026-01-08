/**
 * Farm Service
 * 
 * Comprehensive service for managing Token Owner Farm operations in Dogepump platform.
 * 
 * ## Overview
 * This service provides a complete farming system where token owners can create reward pools
 * and users can stake tokens to earn rewards. The system includes:
 * - Farm creation and lifecycle management
 * - Staking and unstaking operations
 * - Real-time reward calculations
 * - Farm statistics and analytics
 * - Security validations and audit logging
 * - LocalStorage persistence
 * 
 * ## Architecture
 * - **State Management**: In-memory state with localStorage persistence
 * - **Reward Distribution**: Time-based reward calculation with configurable rates
 * - **Security**: Token ownership verification, rate limits, and audit trails
 * - **Performance**: Optimized calculations with periodic updates
 * 
 * @module services/farmService
 * @since 1.0.0
 */

import { Token } from '../types';
import {
  TokenOwnerFarm,
  FarmConfiguration,
  RewardPool,
  FarmStats,
  TokenOwnerFarmPosition,
  CreateFarmRequest,
  DepositRewardsRequest,
  UpdateFarmConfigRequest,
  StakeInFarmRequest,
  UnstakeFromFarmRequest,
  HarvestRewardsRequest,
  FarmListResponse,
} from '../types';

// ============================================================================
// Custom Error Types
// ============================================================================

/**
 * Base class for all farm-related errors
 * @extends Error
 */
export class FarmError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FarmError';
  }
}

/**
 * Error thrown when farm configuration is invalid
 */
export class FarmValidationError extends FarmError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FARM_VALIDATION_ERROR', details);
    this.name = 'FarmValidationError';
  }
}

/**
 * Error thrown when a farm operation is not allowed
 */
export class FarmAccessError extends FarmError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FARM_ACCESS_ERROR', details);
    this.name = 'FarmAccessError';
  }
}

/**
 * Error thrown when farm state prevents an operation
 */
export class FarmStateError extends FarmError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FARM_STATE_ERROR', details);
    this.name = 'FarmStateError';
  }
}

/**
 * Error thrown when storage operations fail
 */
export class FarmStorageError extends FarmError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FARM_STORAGE_ERROR', details);
    this.name = 'FarmStorageError';
  }
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Farm system constants and configuration limits
 */
export const FARM_CONSTANTS = {
  // Reward limits
  MAX_REWARD_RATE: 0.001, // tokens per second per staked unit
  MAX_APY: 50000, // 50,000% maximum APY
  MAX_TOTAL_REWARDS: 1000000000, // 1M tokens max per farm
  
  // Duration limits
  MIN_FARM_DURATION: 86400, // 24 hours
  MAX_FARM_DURATION: 31536000, // 1 year
  
  // Stake limits
  MIN_STAKE_AMOUNT: 1,
  MAX_STAKE_PER_USER: 10000000,
  
  // Calculation intervals
  REWARD_CALCULATION_INTERVAL: 10000, // 10 seconds
  STATS_UPDATE_INTERVAL: 60000, // 1 minute
  
  // Cache durations (for localStorage)
  FARM_CACHE_TTL: 300, // 5 minutes
  POSITION_CACHE_TTL: 60, // 1 minute
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Audit
  AUDIT_LOG_RETENTION_DAYS: 90,
  
  // Security
  MAX_CONFIG_CHANGES_PER_HOUR: 5,
  PAUSE_RESUME_CYCLE_THRESHOLD: 3,
};

// ============================================================================
// Local Storage Keys
// ============================================================================

/**
 * localStorage keys for persisting farm data
 */
const STORAGE_KEYS = {
  FARMS: 'dogepump_farms',
  FARM_POSITIONS: 'dogepump_farm_positions',
  FARM_AUDIT_LOGS: 'dogepump_farm_audit_logs',
  FARM_STATS: 'dogepump_farm_stats',
};

// ============================================================================
// In-Memory State (for demo)
// ============================================================================

let farms: TokenOwnerFarm[] = [];
let farmPositions: TokenOwnerFarmPosition[] = [];
let auditLogs: any[] = [];

// Global tokens reference - set by StoreContext for token lookups
export let globalTokens: Token[] = [];

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize farm service by loading data from localStorage
 * 
 * Loads persisted farm data, positions, and audit logs from localStorage.
 * Starts background intervals for reward calculations and statistics updates.
 * 
 * @throws {FarmStorageError} If localStorage quota is exceeded or data is corrupted
 * @example
 * ```typescript
 * import { initializeFarmService } from './services/farmService';
 * 
 * // Call once at application startup
 * initializeFarmService();
 * ```
 */
export function initializeFarmService(): void {
  try {
    const savedFarms = localStorage.getItem(STORAGE_KEYS.FARMS);
    if (savedFarms) {
      farms = JSON.parse(savedFarms);
    }

    const savedPositions = localStorage.getItem(STORAGE_KEYS.FARM_POSITIONS);
    if (savedPositions) {
      farmPositions = JSON.parse(savedPositions);
    }

    const savedAuditLogs = localStorage.getItem(STORAGE_KEYS.FARM_AUDIT_LOGS);
    if (savedAuditLogs) {
      auditLogs = JSON.parse(savedAuditLogs);
    }

    // Start reward calculation interval
    startRewardCalculation();
    startStatsUpdate();

    console.log('[FarmService] Initialized with', farms.length, 'farms');
  } catch (error) {
    // Handle localStorage quota exceeded error specifically
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[FarmService] localStorage quota exceeded during initialization. Clearing old data...');
      // Attempt to clear old data and retry
      try {
        localStorage.removeItem(STORAGE_KEYS.FARM_AUDIT_LOGS);
        console.log('[FarmService] Cleared audit logs to free space');
      } catch (clearError) {
        throw new FarmStorageError(
          'Failed to clear localStorage quota',
          { originalError: error, clearError }
        );
      }
    } else {
      throw new FarmStorageError(
        'Failed to initialize farm service',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

// ============================================================================
// Farm CRUD Operations
// ============================================================================

/**
 * Create a new farm with specified configuration
 * 
 * Creates a new token owner farm where users can stake tokens to earn rewards.
 * Performs validations:
 * - Verifies caller owns token
 * - Validates farm configuration parameters
 * - Checks sufficient balance for reward deposit
 * 
 * @param request - Farm creation request containing token IDs, configuration, and deposit amount
 * @returns The newly created farm with initialized pool and stats
 * @throws {FarmAccessError} If caller is not token owner
 * @throws {FarmValidationError} If configuration is invalid
 * @throws {FarmStateError} If insufficient balance for reward deposit
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const farm = createFarm({
 *   ownerTokenId: 'token-123',
 *   stakingTokenId: 'token-123',
 *   rewardTokenId: 'token-123',
 *   rewardDepositAmount: 100000,
 *   config: {
 *     rewardRate: 0.0001,
 *     duration: 2592000000, // 30 days
 *     lockPeriod: 86400000, // 1 day
 *     maxStakeAmount: 1000000,
 *     minStakeAmount: 1,
 *     isPaused: false
 *   },
 *   description: 'My awesome farm'
 * });
 * ```
 */
export function createFarm(request: CreateFarmRequest): TokenOwnerFarm {
  // Verify token ownership
  const token = getTokenById(request.ownerTokenId);
  if (!token || token.creator !== 'You') {
    throw new FarmAccessError(
      'You must be the token owner to create a farm',
      { tokenId: request.ownerTokenId, caller: 'You' }
    );
  }

  // Validate farm configuration
  const validation = validateFarmConfig(request.config as FarmConfiguration);
  if (!validation.valid) {
    throw new FarmValidationError(
      `Farm configuration is invalid: ${validation.errors.join(', ')}`,
      { errors: validation.errors, config: request.config }
    );
  }

  // Verify user has enough tokens for reward deposit
  const userBalance = getUserTokenBalance(request.rewardTokenId);
  if (userBalance < request.rewardDepositAmount) {
    throw new FarmStateError(
      `Insufficient balance for reward deposit. Required: ${request.rewardDepositAmount}, Available: ${userBalance}`,
      { 
        required: request.rewardDepositAmount, 
        available: userBalance,
        tokenId: request.rewardTokenId 
      }
    );
  }

  const now = Date.now();
  
  // Create farm
  const farm: TokenOwnerFarm = {
    id: `farm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ownerTokenId: request.ownerTokenId,
    stakingTokenId: request.stakingTokenId,
    rewardTokenId: request.rewardTokenId,
    config: {
      ...request.config,
      createdAt: now,
      updatedAt: now,
      expiresAt: request.config.duration > 0 ? now + (request.config.duration * 1000) : undefined,
    },
    pool: {
      id: `pool-${Date.now()}`,
      farmId: '', // Will be set after farm creation
      rewardTokenId: request.rewardTokenId,
      totalDeposited: request.rewardDepositAmount,
      availableRewards: request.rewardDepositAmount,
      totalDistributed: 0,
      lastCalculatedAt: now,
    },
    stats: {
      totalStaked: 0,
      uniqueStakers: 0,
      currentAPY: calculateAPY(request.config.rewardRate),
      totalRewardsDistributed: 0,
      avgStakeDuration: 0,
      lastUpdated: now,
    },
    status: 'active',
    description: request.description,
  };

  // Link pool to farm
  farm.pool.farmId = farm.id;

  // Deduct reward tokens from user balance
  deductTokenBalance(request.rewardTokenId, request.rewardDepositAmount);

  // Save farm
  farms = [farm, ...farms];
  saveFarms();

  // Create audit log
  createAuditLog({
    farmId: farm.id,
    action: 'farm_created',
    actorAddress: 'You',
    actionData: {
      rewardDepositAmount: request.rewardDepositAmount,
      config: request.config,
    },
  });

  console.log('[FarmService] Created farm:', farm.id);
  return farm;
}

/**
 * Retrieve a farm by its unique identifier
 * 
 * @param farmId - The unique ID of the farm to retrieve
 * @returns The farm if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const farm = getFarmById('farm-1234567890-abc123');
 * if (farm) {
 *   console.log('Farm APY:', farm.stats.currentAPY);
 * }
 * ```
 */
export function getFarmById(farmId: string): TokenOwnerFarm | undefined {
  return farms.find(f => f.id === farmId);
}

/**
 * Retrieve all farms in the system
 * 
 * @returns Array of all farms regardless of status
 * 
 * @example
 * ```typescript
 * const allFarms = getAllFarms();
 * console.log(`Total farms: ${allFarms.length}`);
 * ```
 */
export function getAllFarms(): TokenOwnerFarm[] {
  return farms;
}

/**
 * Retrieve farms owned by the current user
 * 
 * This filters farms where the owner token's creator is 'You'.
 * 
 * @returns Array of farms owned by the current user
 * 
 * @example
 * ```typescript
 * const myFarms = getMyFarms();
 * myFarms.forEach(farm => {
 *   console.log(`${farm.id}: ${farm.pool.availableRewards} rewards available`);
 * });
 * ```
 */
export function getMyFarms(): TokenOwnerFarm[] {
  return farms.filter(f => {
    const token = getTokenById(f.ownerTokenId);
    return token?.creator === 'You';
  });
}

/**
 * Retrieve all active farms
 * 
 * A farm is considered active if its status is 'active'.
 * 
 * @returns Array of farms with active status
 * 
 * @example
 * ```typescript
 * const activeFarms = getActiveFarms();
 * console.log(`${activeFarms.length} farms available for staking`);
 * ```
 */
export function getActiveFarms(): TokenOwnerFarm[] {
  return farms.filter(f => f.status === 'active');
}

/**
 * Update farm configuration parameters
 * 
 * Allows the farm owner to modify farm settings such as reward rate,
 * duration, lock period, and stake limits. The configuration is validated
 * before applying changes.
 * 
 * @param farmId - The ID of the farm to update
 * @param config - Partial configuration object with fields to update
 * @returns The updated farm with new configuration
 * @throws {FarmStateError} If farm is not found
 * @throws {FarmAccessError} If caller is not the farm owner
 * @throws {FarmValidationError} If new configuration is invalid
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const updatedFarm = updateFarmConfig('farm-123', {
 *   rewardRate: 0.0002,
 *   isPaused: true
 * });
 * ```
 */
export function updateFarmConfig(farmId: string, config: Partial<FarmConfiguration>): TokenOwnerFarm {
  const farmIndex = farms.findIndex(f => f.id === farmId);
  if (farmIndex === -1) {
    throw new FarmStateError(
      `Farm not found: ${farmId}`,
      { farmId }
    );
  }

  const farm = farms[farmIndex];
  
  // Verify ownership
  const token = getTokenById(farm.ownerTokenId);
  if (token?.creator !== 'You') {
    throw new FarmAccessError(
      'You must be the farm owner to update configuration',
      { farmId, caller: 'You' }
    );
  }

  // Validate new configuration
  const validation = validateFarmConfig({ ...farm.config, ...config });
  if (!validation.valid) {
    throw new FarmValidationError(
      `Invalid farm configuration: ${validation.errors.join(', ')}`,
      { errors: validation.errors, farmId, newConfig: config }
    );
  }

  // Update farm
  farms[farmIndex] = {
    ...farm,
    config: {
      ...farm.config,
      ...config,
      updatedAt: Date.now(),
    },
  };

  saveFarms();

  // Create audit log
  createAuditLog({
    farmId,
    action: 'config_updated',
    actorAddress: 'You',
    actionData: { oldConfig: farm.config, newConfig: config },
  });

  console.log('[FarmService] Updated farm config:', farmId);
  return farms[farmIndex];
}

/**
 * Pause a farm to temporarily stop reward distribution
 * 
 * Paused farms do not distribute rewards to stakers, but existing positions
 * remain intact and can be unstaked. This is useful for temporary maintenance
 * or adjustments.
 * 
 * @param farmId - The ID of the farm to pause
 * @returns The paused farm
 * @throws {FarmStateError} If farm is not found
 * @throws {FarmAccessError} If caller is not the farm owner
 * 
 * @example
 * ```typescript
 * const pausedFarm = pauseFarm('farm-123');
 * console.log('Farm is now paused:', pausedFarm.config.isPaused);
 * ```
 */
export function pauseFarm(farmId: string): TokenOwnerFarm {
  return updateFarmConfig(farmId, { isPaused: true });
}

/**
 * Resume a paused farm to resume reward distribution
 * 
 * @param farmId - The ID of the farm to resume
 * @returns The resumed farm
 * @throws {FarmStateError} If farm is not found
 * @throws {FarmAccessError} If caller is not the farm owner
 * 
 * @example
 * ```typescript
 * const resumedFarm = resumeFarm('farm-123');
 * console.log('Farm is now active:', !resumedFarm.config.isPaused);
 * ```
 */
export function resumeFarm(farmId: string): TokenOwnerFarm {
  return updateFarmConfig(farmId, { isPaused: false });
}

/**
 * Permanently close a farm and refund remaining rewards to the owner
 * 
 * This operation can only be performed if there are no active stakers in the farm.
 * All remaining rewards in the pool are returned to the farm owner.
 * 
 * @param farmId - The ID of the farm to close
 * @returns Object containing the closed farm and refunded amount
 * @throws {FarmStateError} If farm is not found or has active stakers
 * @throws {FarmAccessError} If caller is not the farm owner
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const { farm, refundedAmount } = closeFarm('farm-123');
 * console.log(`Farm closed. Refunded: ${refundedAmount} tokens`);
 * ```
 */
export function closeFarm(farmId: string): { farm: TokenOwnerFarm; refundedAmount: number } {
  const farm = getFarmById(farmId);
  if (!farm) {
    throw new FarmStateError(
      `Farm not found: ${farmId}`,
      { farmId }
    );
  }

  // Verify ownership
  const token = getTokenById(farm.ownerTokenId);
  if (token?.creator !== 'You') {
    throw new FarmAccessError(
      'You must be the farm owner to close it',
      { farmId, caller: 'You' }
    );
  }

  // Check if users are still staked
  const activePositions = farmPositions.filter(p => p.farmId === farmId && p.stakedAmount > 0);
  if (activePositions.length > 0) {
    throw new FarmStateError(
      'Cannot close farm with active stakers',
      { 
        farmId, 
        activeStakers: activePositions.length,
        positions: activePositions.map(p => ({ id: p.id, amount: p.stakedAmount }))
      }
    );
  }

  // Calculate refund amount
  const refundedAmount = farm.pool.availableRewards;

  // Return rewards to owner
  addTokenBalance(farm.rewardTokenId, refundedAmount);

  // Update farm status
  const farmIndex = farms.findIndex(f => f.id === farmId);
  farms[farmIndex] = {
    ...farm,
    status: 'closed',
    pool: {
      ...farm.pool,
      availableRewards: 0,
    },
  };

  saveFarms();

  // Create audit log
  createAuditLog({
    farmId,
    action: 'farm_closed',
    actorAddress: 'You',
    actionData: { refundedAmount },
  });

  console.log('[FarmService] Closed farm:', farmId, 'Refunded:', refundedAmount);
  return { farm: farms[farmIndex], refundedAmount };
}

/**
 * Deposit additional rewards into a farm's reward pool
 * 
 * Increases available rewards for stakers. The farm owner must have
 * sufficient balance to make the deposit.
 * 
 * @param farmId - The ID of the farm to deposit rewards into
 * @param amount - The amount of reward tokens to deposit
 * @returns The updated reward pool
 * @throws {FarmStateError} If farm is not found
 * @throws {FarmAccessError} If caller is not the farm owner
 * @throws {FarmStateError} If insufficient balance for deposit
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const pool = depositRewards('farm-123', 50000);
 * console.log(`New pool balance: ${pool.availableRewards}`);
 * ```
 */
export function depositRewards(farmId: string, amount: number): RewardPool {
  const farm = getFarmById(farmId);
  if (!farm) {
    throw new FarmStateError(
      `Farm not found: ${farmId}`,
      { farmId }
    );
  }

  // Verify ownership
  const token = getTokenById(farm.ownerTokenId);
  if (token?.creator !== 'You') {
    throw new FarmAccessError(
      'You must be the farm owner to deposit rewards',
      { farmId, caller: 'You' }
    );
  }

  // Verify user has enough tokens
  const userBalance = getUserTokenBalance(farm.rewardTokenId);
  if (userBalance < amount) {
    throw new FarmStateError(
      `Insufficient balance for reward deposit. Required: ${amount}, Available: ${userBalance}`,
      { 
        required: amount, 
        available: userBalance,
        tokenId: farm.rewardTokenId 
      }
    );
  }

  // Deduct tokens from user
  deductTokenBalance(farm.rewardTokenId, amount);

  // Update pool
  const farmIndex = farms.findIndex(f => f.id === farmId);
  farms[farmIndex] = {
    ...farm,
    pool: {
      ...farm.pool,
      totalDeposited: farm.pool.totalDeposited + amount,
      availableRewards: farm.pool.availableRewards + amount,
      lastCalculatedAt: Date.now(),
    },
  };

  saveFarms();

  // Create audit log
  createAuditLog({
    farmId,
    action: 'rewards_deposited',
    actorAddress: 'You',
    actionData: { amount },
  });

  console.log('[FarmService] Deposited rewards:', amount, 'to farm:', farmId);
  return farms[farmIndex].pool;
}

// ============================================================================
// Staking Operations
// ============================================================================

/**
 * Stake tokens in a farm to earn rewards
 * 
 * Users can stake tokens in active farms to earn rewards based on
 * the farm's reward rate. The position tracks accumulated rewards that can be
 * harvested at any time.
 * 
 * @param request - Staking request containing farm ID and amount to stake
 * @returns The created or updated staking position
 * @throws {FarmStateError} If farm is not found, inactive, paused, or expired
 * @throws {FarmStateError} If insufficient balance for staking
 * @throws {FarmStateError} If amount is below minimum or above maximum
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const position = stakeInFarm({
 *   farmId: 'farm-123',
 *   amount: 1000
 * });
 * console.log(`Staked: ${position.stakedAmount} tokens`);
 * ```
 */
export function stakeInFarm(request: StakeInFarmRequest): TokenOwnerFarmPosition {
  const farm = getFarmById(request.farmId);
  if (!farm) {
    throw new FarmStateError(
      `Farm not found: ${request.farmId}`,
      { farmId: request.farmId }
    );
  }

  // Check farm status
  if (farm.status !== 'active') {
    throw new FarmStateError(
      `Farm is not active. Current status: ${farm.status}`,
      { farmId: request.farmId, status: farm.status }
    );
  }

  if (farm.config.isPaused) {
    throw new FarmStateError(
      'Farm is paused by owner',
      { farmId: request.farmId }
    );
  }

  // Check if farm is expired
  if (farm.config.expiresAt && Date.now() > farm.config.expiresAt) {
    throw new FarmStateError(
      'Farm has expired',
      { 
        farmId: request.farmId, 
        expiredAt: farm.config.expiresAt,
        currentTime: Date.now() 
      }
    );
  }

  // Check minimum stake amount
  if (request.amount < farm.config.minStakeAmount) {
    throw new FarmStateError(
      `Minimum stake amount is ${farm.config.minStakeAmount}`,
      {
        farmId: request.farmId,
        requested: request.amount,
        minimum: farm.config.minStakeAmount
      }
    );
  }

  // Check maximum stake amount
  if (farm.config.maxStakeAmount > 0 && request.amount > farm.config.maxStakeAmount) {
    throw new FarmStateError(
      `Maximum stake amount is ${farm.config.maxStakeAmount}`,
      {
        farmId: request.farmId,
        requested: request.amount,
        maximum: farm.config.maxStakeAmount
      }
    );
  }

  // Verify user has enough tokens to stake
  const userBalance = getUserTokenBalance(farm.stakingTokenId);
  if (userBalance < request.amount) {
    throw new FarmStateError(
      `Insufficient balance for staking. Required: ${request.amount}, Available: ${userBalance}`,
      {
        required: request.amount,
        available: userBalance,
        tokenId: farm.stakingTokenId
      }
    );
  }

  // Check if user already has a position
  let position = farmPositions.find(p => p.farmId === request.farmId && p.userAddress === 'You');
  const now = Date.now();

  if (position) {
    // Update existing position
    const positionIndex = farmPositions.findIndex(p => p.id === position.id);
    position = {
      ...position,
      stakedAmount: position.stakedAmount + request.amount,
      accumulatedRewards: calculateAccumulatedRewards(position, farm.config.rewardRate),
      lastHarvestTime: now,
    };
    farmPositions[positionIndex] = position;
  } else {
    // Create new position
    position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      farmId: request.farmId,
      userAddress: 'You',
      stakedAmount: request.amount,
      stakedAt: now,
      lastHarvestTime: now,
      accumulatedRewards: 0,
      isLocked: farm.config.lockPeriod > 0,
      lockExpiresAt: farm.config.lockPeriod > 0 ? now + (farm.config.lockPeriod * 1000) : undefined,
    };
    farmPositions = [position, ...farmPositions];
  }

  // Deduct staked tokens from user
  deductTokenBalance(farm.stakingTokenId, request.amount);

  // Update farm statistics
  const farmIndex = farms.findIndex(f => f.id === request.farmId);
  farms[farmIndex] = {
    ...farm,
    stats: {
      ...farm.stats,
      totalStaked: farm.stats.totalStaked + request.amount,
      uniqueStakers: farm.stats.uniqueStakers + (position ? 0 : 1),
      currentAPY: calculateCurrentAPY(farm.config.rewardRate, farm.stats.totalStaked + request.amount),
      lastUpdated: now,
    },
  };

  saveFarms();
  saveFarmPositions();

  console.log('[FarmService] Staked:', request.amount, 'in farm:', request.farmId);
  return position;
}

/**
 * Unstake tokens from a farm and claim accumulated rewards
 * 
 * Users can unstake tokens from their positions. Rewards are automatically
 * calculated and transferred to the user. Positions can be partially or fully
 * unstaked. Locked positions cannot be unstaked before the lock period expires.
 * 
 * @param request - Unstaking request containing farm ID and amount to unstake
 * @returns Object containing the updated position and rewards claimed
 * @throws {FarmStateError} If farm or position is not found
 * @throws {FarmStateError} If position is locked
 * @throws {FarmStateError} If insufficient staked amount
 * @throws {FarmStateError} If insufficient rewards in pool
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const { position, rewards } = unstakeFromFarm({
 *   farmId: 'farm-123',
 *   amount: 500
 * });
 * console.log(`Unstaked: ${rewards} rewards claimed`);
 * ```
 */
export function unstakeFromFarm(request: UnstakeFromFarmRequest): { position: TokenOwnerFarmPosition; rewards: number } {
  const farm = getFarmById(request.farmId);
  if (!farm) {
    throw new FarmStateError(
      `Farm not found: ${request.farmId}`,
      { farmId: request.farmId }
    );
  }

  const position = farmPositions.find(p => p.farmId === request.farmId && p.userAddress === 'You');
  if (!position) {
    throw new FarmStateError(
      'Position not found for this user in the specified farm',
      { farmId: request.farmId, userAddress: 'You' }
    );
  }

  // Check lock period
  if (position.isLocked && position.lockExpiresAt && Date.now() < position.lockExpiresAt) {
    const remainingTime = Math.ceil((position.lockExpiresAt - Date.now()) / 1000 / 60);
    throw new FarmStateError(
      `Position is locked. Wait ${remainingTime} minutes.`,
      { 
        positionId: position.id,
        lockExpiresAt: position.lockExpiresAt,
        remainingMinutes: remainingTime
      }
    );
  }

  // Check if user has enough staked to unstake
  if (request.amount > position.stakedAmount) {
    throw new FarmStateError(
      `Insufficient staked amount. Requested: ${request.amount}, Available: ${position.stakedAmount}`,
      { 
        positionId: position.id,
        requested: request.amount,
        available: position.stakedAmount
      }
    );
  }

  // Calculate final rewards
  const finalRewards = calculateAccumulatedRewards(position, farm.config.rewardRate);

  // Check if pool has enough rewards
  if (finalRewards > farm.pool.availableRewards) {
    throw new FarmStateError(
      `Insufficient rewards in pool. Required: ${finalRewards}, Available: ${farm.pool.availableRewards}`,
      { 
        farmId: request.farmId,
        required: finalRewards,
        available: farm.pool.availableRewards
      }
    );
  }

  // Return staked tokens to user
  addTokenBalance(farm.stakingTokenId, request.amount);

  // Transfer rewards to user
  addTokenBalance(farm.rewardTokenId, finalRewards);

  // Update pool
  const farmIndex = farms.findIndex(f => f.id === request.farmId);
  farms[farmIndex] = {
    ...farm,
    pool: {
      ...farm.pool,
      availableRewards: farm.pool.availableRewards - finalRewards,
      totalDistributed: farm.pool.totalDistributed + finalRewards,
      lastCalculatedAt: Date.now(),
    },
    stats: {
      ...farm.stats,
      totalStaked: Math.max(0, farm.stats.totalStaked - request.amount),
      totalRewardsDistributed: farm.stats.totalRewardsDistributed + finalRewards,
      lastUpdated: Date.now(),
    },
  };

  // Update or remove position
  const positionIndex = farmPositions.findIndex(p => p.id === position.id);
  if (request.amount >= position.stakedAmount) {
    // Remove position if fully unstaking
    farmPositions = farmPositions.filter(p => p.id !== position.id);
  } else {
    // Update position if partially unstaking
    farmPositions[positionIndex] = {
      ...position,
      stakedAmount: position.stakedAmount - request.amount,
      accumulatedRewards: 0,
      lastHarvestTime: Date.now(),
    };
  }

  saveFarms();
  saveFarmPositions();

  console.log('[FarmService] Unstaked:', request.amount, 'Rewards:', finalRewards);
  return { position: farmPositions[positionIndex] || position, rewards: finalRewards };
}

/**
 * Harvest accumulated rewards from a staking position
 * 
 * Claims all accumulated rewards for a user's position in a farm without
 * unstaking the staked tokens. Rewards are calculated based on the time elapsed
 * since the last harvest and the farm's reward rate.
 * 
 * @param farmId - The ID of the farm to harvest rewards from
 * @returns The amount of rewards harvested
 * @throws {FarmStateError} If farm or position is not found
 * @throws {FarmStateError} If no rewards available to harvest
 * @throws {FarmStateError} If insufficient rewards in pool
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * const rewards = harvestFarmRewards('farm-123');
 * console.log(`Harvested: ${rewards} tokens`);
 * ```
 */
export function harvestFarmRewards(farmId: string): number {
  const farm = getFarmById(farmId);
  if (!farm) {
    throw new FarmStateError(
      `Farm not found: ${farmId}`,
      { farmId }
    );
  }

  const position = farmPositions.find(p => p.farmId === farmId && p.userAddress === 'You');
  if (!position) {
    throw new FarmStateError(
      'Position not found for this user in the specified farm',
      { farmId, userAddress: 'You' }
    );
  }

  // Calculate accumulated rewards
  const rewards = calculateAccumulatedRewards(position, farm.config.rewardRate);

  if (rewards <= 0) {
    throw new FarmStateError(
      'No rewards to harvest',
      { 
        farmId,
        positionId: position.id,
        accumulatedRewards: position.accumulatedRewards
      }
    );
  }

  // Check if pool has enough rewards
  if (rewards > farm.pool.availableRewards) {
    throw new FarmStateError(
      `Insufficient rewards in pool. Required: ${rewards}, Available: ${farm.pool.availableRewards}`,
      { 
        farmId,
        required: rewards,
        available: farm.pool.availableRewards
      }
    );
  }

  // Transfer rewards to user
  addTokenBalance(farm.rewardTokenId, rewards);

  // Update pool
  const farmIndex = farms.findIndex(f => f.id === farmId);
  farms[farmIndex] = {
    ...farm,
    pool: {
      ...farm.pool,
      availableRewards: farm.pool.availableRewards - rewards,
      totalDistributed: farm.pool.totalDistributed + rewards,
      lastCalculatedAt: Date.now(),
    },
    stats: {
      ...farm.stats,
      totalRewardsDistributed: farm.stats.totalRewardsDistributed + rewards,
      lastUpdated: Date.now(),
    },
  };

  // Update position
  const positionIndex = farmPositions.findIndex(p => p.id === position.id);
  farmPositions[positionIndex] = {
    ...position,
    accumulatedRewards: 0,
    lastHarvestTime: Date.now(),
  };

  saveFarms();
  saveFarmPositions();

  console.log('[FarmService] Harvested rewards:', rewards, 'from farm:', farmId);
  return rewards;
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get user's positions in a farm
 * 
 * Retrieves all staking positions for the current user, optionally filtered by farm.
 * 
 * @param farmId - Optional farm ID to filter positions. If not provided, returns all user positions.
 * @returns Array of user's staking positions
 * 
 * @example
 * ```typescript
 * // Get all positions for a specific farm
 * const positions = getUserFarmPositions('farm-123');
 * 
 * // Get all user positions across all farms
 * const allPositions = getUserFarmPositions();
 * ```
 */
export function getUserFarmPositions(farmId?: string): TokenOwnerFarmPosition[] {
  if (farmId) {
    return farmPositions.filter(p => p.farmId === farmId && p.userAddress === 'You');
  }
  return farmPositions.filter(p => p.userAddress === 'You');
}

/**
 * Get farm statistics
 * 
 * @param farmId - The ID of the farm to get statistics for
 * @returns The farm's statistics if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const stats = getFarmStats('farm-123');
 * if (stats) {
 *   console.log(`Total staked: ${stats.totalStaked}`);
 * }
 * ```
 */
export function getFarmStats(farmId: string): FarmStats | undefined {
  const farm = getFarmById(farmId);
  return farm?.stats;
}

// ============================================================================
// Reward Calculations
// ============================================================================

/**
 * Calculate accumulated rewards for a position
 * 
 * Calculates rewards based on time elapsed since last harvest and the farm's reward rate.
 * Formula: rewards = (timeSinceLastHarvest / 1000) * rewardRate * stakedAmount
 * 
 * @param position - The staking position to calculate rewards for
 * @param rewardRate - The farm's reward rate (tokens per second per staked unit)
 * @returns Total accumulated rewards including previously unharvested rewards
 * 
 * @example
 * ```typescript
 * const rewards = calculateAccumulatedRewards(position, 0.0001);
 * ```
 */
function calculateAccumulatedRewards(position: TokenOwnerFarmPosition, rewardRate: number): number {
  const now = Date.now();
  const timeSinceLastHarvest = (now - position.lastHarvestTime) / 1000; // convert to seconds
  
  const newRewards = timeSinceLastHarvest * rewardRate * position.stakedAmount;
  
  return position.accumulatedRewards + newRewards;
}

/**
 * Calculate APY based on reward rate
 * 
 * Calculates the Annual Percentage Yield (APY) based on the reward rate.
 * Formula: APY = (rewardRate * 86400 * 365) * 100
 * 
 * @param rewardRate - The reward rate in tokens per second per staked unit
 * @returns The calculated APY, capped at MAX_APY
 * 
 * @example
 * ```typescript
 * const apy = calculateAPY(0.0001);
 * console.log(`APY: ${apy}%`);
 * ```
 */
export function calculateAPY(rewardRate: number): number {
  const dailyRewards = rewardRate * 86400; // tokens per day per staked unit
  const yearlyRewards = dailyRewards * 365; // tokens per year per staked unit
  const apy = yearlyRewards * 100; // as percentage
  
  return Math.min(apy, FARM_CONSTANTS.MAX_APY); // Cap at maximum
}

/**
 * Calculate current APY for a farm based on TVL
 * 
 * Calculates the effective APY considering the total value locked in the farm.
 * Returns 0 if no tokens are staked.
 * 
 * @param rewardRate - The farm's reward rate in tokens per second per staked unit
 * @param totalStaked - Total tokens staked in the farm
 * @returns The calculated APY, capped at MAX_APY
 * 
 * @example
 * ```typescript
 * const currentAPY = calculateCurrentAPY(0.0001, 50000);
 * console.log(`Current APY: ${currentAPY}%`);
 * ```
 */
export function calculateCurrentAPY(rewardRate: number, totalStaked: number): number {
  if (totalStaked === 0) return 0;
  
  const dailyRewards = rewardRate * totalStaked * 86400;
  const yearlyRewards = dailyRewards * 365;
  const apy = (yearlyRewards / totalStaked) * 100;
  
  return Math.min(apy, FARM_CONSTANTS.MAX_APY);
}

// ============================================================================
// Background Processes
// ============================================================================

/**
 * Start reward calculation interval
 * 
 * Starts a background interval that updates all positions with new rewards
 * every REWARD_CALCULATION_INTERVAL (10 seconds).
 * 
 * @example
 * ```typescript
 * // Called automatically during initialization
 * startRewardCalculation();
 * ```
 */
function startRewardCalculation(): void {
  setInterval(() => {
    try {
      updateAllPositions();
    } catch (error) {
      console.error('[FarmService] Reward calculation error:', error);
    }
  }, FARM_CONSTANTS.REWARD_CALCULATION_INTERVAL);
}

/**
 * Update all positions with new rewards
 * 
 * Iterates through all active farms and their positions, calculating
 * and distributing rewards. Pauses farms when reward pool is exhausted.
 * 
 * @example
 * ```typescript
 * // Called automatically by the reward calculation interval
 * updateAllPositions();
 * ```
 */
function updateAllPositions(): void {
  const activeFarms = getActiveFarms();
  
  for (const farm of activeFarms) {
    if (farm.config.isPaused) continue;
    if (farm.pool.availableRewards <= 0) continue;
    
    const positions = farmPositions.filter(p => p.farmId === farm.id);
    
    for (const position of positions) {
      const newRewards = calculateAccumulatedRewards(position, farm.config.rewardRate);
      
      // Check if pool has enough rewards
      const rewardsToDistribute = newRewards - position.accumulatedRewards;
      if (rewardsToDistribute > farm.pool.availableRewards) {
        // Pool exhausted - pause farm
        pauseFarm(farm.id);
        console.log('[FarmService] Farm paused due to empty reward pool:', farm.id);
        break;
      }
      
      // Update position
      const positionIndex = farmPositions.findIndex(p => p.id === position.id);
      farmPositions[positionIndex] = {
        ...position,
        accumulatedRewards: newRewards,
      };
      
      // Update pool
      const farmIndex = farms.findIndex(f => f.id === farm.id);
      farms[farmIndex] = {
        ...farm,
        pool: {
          ...farm.pool,
          availableRewards: farm.pool.availableRewards - rewardsToDistribute,
          totalDistributed: farm.pool.totalDistributed + rewardsToDistribute,
          lastCalculatedAt: Date.now(),
        },
      };
    }
  }
  
  saveFarms();
  saveFarmPositions();
}

/**
 * Start statistics update interval
 * 
 * Starts a background interval that updates farm statistics
 * every STATS_UPDATE_INTERVAL (1 minute).
 * 
 * @example
 * ```typescript
 * // Called automatically during initialization
 * startStatsUpdate();
 * ```
 */
function startStatsUpdate(): void {
  setInterval(() => {
    try {
      updateFarmStatistics();
    } catch (error) {
      console.error('[FarmService] Stats update error:', error);
    }
  }, FARM_CONSTANTS.STATS_UPDATE_INTERVAL);
}

/**
 * Update farm statistics
 * 
 * Recalculates statistics for all active farms including:
 * - Total staked amount
 * - Number of unique stakers
 * - Current APY
 * 
 * @example
 * ```typescript
 * // Called automatically by the stats update interval
 * updateFarmStatistics();
 * ```
 */
function updateFarmStatistics(): void {
  const activeFarms = getActiveFarms();
  
  for (const farm of activeFarms) {
    const positions = farmPositions.filter(p => p.farmId === farm.id);
    
    if (positions.length === 0) continue;
    
    const totalStaked = positions.reduce((sum, p) => sum + p.stakedAmount, 0);
    const uniqueStakers = new Set(positions.map(p => p.userAddress)).size;
    
    const farmIndex = farms.findIndex(f => f.id === farm.id);
    farms[farmIndex] = {
      ...farm,
      stats: {
        ...farm.stats,
        totalStaked,
        uniqueStakers,
        currentAPY: calculateCurrentAPY(farm.config.rewardRate, totalStaked),
        lastUpdated: Date.now(),
      },
    };
  }
  
  saveFarms();
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate farm configuration
 * 
 * Validates all farm configuration parameters against system limits and business rules.
 * Returns validation result with any errors found.
 * 
 * @param config - The farm configuration to validate
 * @returns Object with valid flag and array of error messages
 * 
 * @example
 * ```typescript
 * const validation = validateFarmConfig({
 *   rewardRate: 0.0001,
 *   duration: 2592000000,
 *   lockPeriod: 86400000,
 *   maxStakeAmount: 1000000,
 *   minStakeAmount: 1,
 *   isPaused: false
 * });
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
function validateFarmConfig(config: FarmConfiguration): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Reward rate must be positive
  if (config.rewardRate <= 0) {
    errors.push('Reward rate must be greater than 0');
  }
  
  // Reward rate must not exceed maximum
  if (config.rewardRate > FARM_CONSTANTS.MAX_REWARD_RATE) {
    errors.push(`Reward rate cannot exceed ${FARM_CONSTANTS.MAX_REWARD_RATE}`);
  }
  
  // Check APY limit
  const apy = calculateAPY(config.rewardRate);
  if (apy > FARM_CONSTANTS.MAX_APY) {
    errors.push(`APY cannot exceed ${FARM_CONSTANTS.MAX_APY}%`);
  }
  
  // Duration must be valid
  if (config.duration < 0) {
    errors.push('Duration cannot be negative');
  }
  
  if (config.duration > 0 && config.duration < FARM_CONSTANTS.MIN_FARM_DURATION) {
    errors.push(`Duration must be at least ${FARM_CONSTANTS.MIN_FARM_DURATION} seconds`);
  }
  
  if (config.duration > 0 && config.duration > FARM_CONSTANTS.MAX_FARM_DURATION) {
    errors.push(`Duration cannot exceed ${FARM_CONSTANTS.MAX_FARM_DURATION} seconds`);
  }
  
  // Lock period must not exceed duration
  if (config.duration > 0 && config.lockPeriod > config.duration) {
    errors.push('Lock period cannot exceed farm duration');
  }
  
  // Max stake must be >= min stake
  if (config.maxStakeAmount > 0 && config.minStakeAmount > config.maxStakeAmount) {
    errors.push('Minimum stake cannot exceed maximum stake');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Create audit log entry
 * 
 * Creates an audit log entry for tracking farm operations. Old logs are
 * automatically pruned based on AUDIT_LOG_RETENTION_DAYS.
 * 
 * @param entry - The audit log entry to create
 * @throws {FarmStorageError} If saving to localStorage fails
 * 
 * @example
 * ```typescript
 * createAuditLog({
 *   farmId: 'farm-123',
 *   action: 'farm_created',
 *   actorAddress: 'You',
 *   actionData: { rewardDepositAmount: 100000 }
 * });
 * ```
 */
function createAuditLog(entry: {
  farmId: string;
  action: string;
  actorAddress: string;
  actionData?: any;
}): void {
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...entry,
  };
  
  auditLogs = [log, ...auditLogs];
  
  // Prune old logs
  const cutoffTime = Date.now() - (FARM_CONSTANTS.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  auditLogs = auditLogs.filter(l => l.timestamp > cutoffTime);
  
  try {
    localStorage.setItem(STORAGE_KEYS.FARM_AUDIT_LOGS, JSON.stringify(auditLogs));
  } catch (error) {
    // Handle localStorage quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[FarmService] localStorage quota exceeded while saving audit logs. Skipping log entry.');
      // Silently skip saving this log entry to prevent blocking operations
    } else {
      console.error('[FarmService] Error saving audit logs:', error);
    }
  }
}

/**
 * Get audit logs for a farm
 * 
 * Retrieves audit logs for a specific farm, sorted by most recent first.
 * 
 * @param farmId - The ID of the farm to get audit logs for
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of audit log entries
 * 
 * @example
 * ```typescript
 * const logs = getFarmAuditLogs('farm-123', 10);
 * logs.forEach(log => {
 *   console.log(`${log.action} by ${log.actorAddress}`);
 * });
 * ```
 */
export function getFarmAuditLogs(farmId: string, limit: number = 50): any[] {
  return auditLogs
    .filter(l => l.farmId === farmId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Save farms to localStorage with quota error handling
 * 
 * @throws {FarmStorageError} If saving fails and cannot be recovered
 */
function saveFarms(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
  } catch (error) {
    // Handle localStorage quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[FarmService] localStorage quota exceeded while saving farms. Attempting to free space...');
      // Try to clear audit logs to free space
      try {
        localStorage.removeItem(STORAGE_KEYS.FARM_AUDIT_LOGS);
        console.log('[FarmService] Cleared audit logs to free space');
        // Retry saving farms
        localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
      } catch (retryError) {
        console.error('[FarmService] Failed to save farms even after clearing space:', retryError);
        throw new FarmStorageError(
          'Unable to save farm data due to localStorage quota limit',
          { originalError: error, retryError }
        );
      }
    } else {
      console.error('[FarmService] Error saving farms:', error);
      throw new FarmStorageError(
        'Failed to save farms to localStorage',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

/**
 * Save farm positions to localStorage with quota error handling
 * 
 * @throws {FarmStorageError} If saving fails and cannot be recovered
 */
function saveFarmPositions(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FARM_POSITIONS, JSON.stringify(farmPositions));
  } catch (error) {
    // Handle localStorage quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[FarmService] localStorage quota exceeded while saving positions. Attempting to free space...');
      // Try to clear audit logs to free space
      try {
        localStorage.removeItem(STORAGE_KEYS.FARM_AUDIT_LOGS);
        console.log('[FarmService] Cleared audit logs to free space');
        // Retry saving positions
        localStorage.setItem(STORAGE_KEYS.FARM_POSITIONS, JSON.stringify(farmPositions));
      } catch (retryError) {
        console.error('[FarmService] Failed to save positions even after clearing space:', retryError);
        throw new FarmStorageError(
          'Unable to save position data due to localStorage quota limit',
          { originalError: error, retryError }
        );
      }
    } else {
      console.error('[FarmService] Error saving positions:', error);
      throw new FarmStorageError(
        'Failed to save positions to localStorage',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

// ============================================================================
// Token Balance Helpers (Mock Implementation)
// NOTE: For production, these functions should be replaced with real StoreContext integration
// to properly manage token balances and transactions. The current implementation provides
// mock data for demonstration purposes only.
// ============================================================================

/**
 * Get token by ID (mock implementation)
 * 
 * PRODUCTION TODO: Replace with StoreContext integration
 * Import StoreContext and use it to get token data:
 * import { useStore } from '../contexts/StoreContext';
 * const { getTokenById } = useStore();
 * return getTokenById(tokenId);
 * 
 * @param tokenId - The token ID to retrieve
 * @returns The token if found, undefined otherwise
 */
function getTokenById(tokenId: string): Token | undefined {
  // Use global tokens reference set by StoreContext
  return globalTokens.find(t => t.id === tokenId);
}

/**
 * Get user's token balance (mock implementation)
 * 
 * PRODUCTION TODO: Replace with StoreContext integration
 * Import StoreContext and use it to get user's token balance:
 * import { useStore } from '../contexts/StoreContext';
 * const { getUserBalance } = useStore();
 * return getUserBalance(tokenId);
 * 
 * @param tokenId - The token ID to get balance for
 * @returns The user's balance (mock: 1,000,000)
 */
function getUserTokenBalance(tokenId: string): number {
  // PRODUCTION TODO: Replace with StoreContext integration
  // Import StoreContext and use it to get user's token balance:
  // import { useStore } from '../contexts/StoreContext';
  // const { getUserBalance } = useStore();
  // return getUserBalance(tokenId);
  return 1000000; // Mock balance
}

/**
 * Deduct tokens from user balance (mock implementation)
 * 
 * PRODUCTION TODO: Replace with StoreContext integration
 * Import StoreContext and use it to deduct tokens from user balance:
 * import { useStore } from '../contexts/StoreContext';
 * const { deductBalance } = useStore();
 * deductBalance(tokenId, amount);
 * 
 * @param tokenId - The token ID to deduct from
 * @param amount - The amount to deduct
 */
function deductTokenBalance(tokenId: string, amount: number): void {
  // PRODUCTION TODO: Replace with StoreContext integration
  // Import StoreContext and use it to deduct tokens from user balance:
  // import { useStore } from '../contexts/StoreContext';
  // const { deductBalance } = useStore();
  // deductBalance(tokenId, amount);
  console.log('[FarmService] Deducting', amount, 'from token:', tokenId);
}

/**
 * Add tokens to user balance (mock implementation)
 * 
 * PRODUCTION TODO: Replace with StoreContext integration
 * Import StoreContext and use it to add tokens to user balance:
 * import { useStore } from '../contexts/StoreContext';
 * const { addBalance } = useStore();
 * addBalance(tokenId, amount);
 * 
 * @param tokenId - The token ID to add to
 * @param amount - The amount to add
 */
function addTokenBalance(tokenId: string, amount: number): void {
  // PRODUCTION TODO: Replace with StoreContext integration
  // Import StoreContext and use it to add tokens to user balance:
  // import { useStore } from '../contexts/StoreContext';
  // const { addBalance } = useStore();
  // addBalance(tokenId, amount);
  console.log('[FarmService] Adding', amount, 'to token:', tokenId);
}

// ============================================================================
// Export Service
// ============================================================================

/**
 * Farm service export object
 * 
 * Provides access to all farm service functionality through a single export.
 * 
 * @example
 * ```typescript
 * import { farmService } from './services/farmService';
 * 
 * // Create a farm
 * const farm = farmService.createFarm(request);
 * 
 * // Get user's farms
 * const myFarms = farmService.getMyFarms();
 * ```
 */
/**
 * Set global tokens reference for token lookups
 * Called by StoreContext during initialization
 *
 * @param tokens - Array of tokens to use for lookups
 */
export function setGlobalTokens(tokens: Token[]): void {
  globalTokens = tokens;
  console.log('[FarmService] Global tokens reference set:', tokens.length, 'tokens');
}

export const farmService = {
  // Farm CRUD
  createFarm,
  getFarmById,
  getAllFarms,
  getMyFarms,
  getActiveFarms,
  updateFarmConfig,
  pauseFarm,
  resumeFarm,
  closeFarm,
  depositRewards,
  
  // Staking
  stakeInFarm,
  unstakeFromFarm,
  harvestFarmRewards,
  
  // Queries
  getUserFarmPositions,
  getFarmStats,
  
  // Calculations
  calculateAPY,
  calculateCurrentAPY,
  
  // Audit
  getFarmAuditLogs,
  
  // Initialization
  initializeFarmService,
  setGlobalTokens,
};

export default farmService;
