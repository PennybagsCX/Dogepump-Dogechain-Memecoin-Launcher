-- Memecoin Staking Migration
-- Enables users to stake memecoins to earn $KARMA rewards

-- ================================================================
-- Table: memecoin_stakes
-- Stores user's memecoin staking positions
-- ================================================================
CREATE TABLE IF NOT EXISTS memecoin_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_id VARCHAR(255) NOT NULL,
  amount DECIMAL(78, 0) NOT NULL,
  token_price DECIMAL(30, 18) NOT NULL, -- Token price at stake time (USD with 18 decimals)
  staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reward_calculation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pending_karma DECIMAL(78, 0) DEFAULT 0,
  claimed_karma DECIMAL(78, 0) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  unstaked_at TIMESTAMP WITH TIME ZONE,
  unstake_amount DECIMAL(78, 0),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memecoin_stakes_user ON memecoin_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_stakes_token ON memecoin_stakes(token_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_stakes_user_token ON memecoin_stakes(user_id, token_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_stakes_active ON memecoin_stakes(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_memecoin_stakes_created_at ON memecoin_stakes(created_at DESC);

-- ================================================================
-- Table: memecoin_reward_distributions
-- Tracks $KARMA reward distributions for memecoin staking
-- ================================================================
CREATE TABLE IF NOT EXISTS memecoin_reward_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id VARCHAR(255) NOT NULL,
  total_staked DECIMAL(78, 0) NOT NULL,
  karma_distributed DECIMAL(78, 0) NOT NULL,
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_token ON memecoin_reward_distributions(token_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_distributed_at ON memecoin_reward_distributions(distributed_at DESC);

-- ================================================================
-- Table: supported_staking_tokens
-- Configuration for which tokens can be staked and their reward rates
-- ================================================================
CREATE TABLE IF NOT EXISTS supported_staking_tokens (
  token_id VARCHAR(255) PRIMARY KEY,
  token_symbol VARCHAR(50) NOT NULL,
  reward_rate INTEGER NOT NULL, -- Basis points per day (e.g., 100 = 1% daily)
  enabled BOOLEAN DEFAULT TRUE,
  min_stake_amount DECIMAL(78, 0) DEFAULT 0,
  max_stake_amount DECIMAL(78, 0),
  unstake_fee_percent INTEGER DEFAULT 0, -- Fee for unstaking (0-100)
  contract_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supported_tokens_enabled ON supported_staking_tokens(enabled) WHERE enabled = TRUE;

-- ================================================================
-- Table: memecoin_rewards_claimed
-- Audit log of $KARMA rewards claimed by users
-- ================================================================
CREATE TABLE IF NOT EXISTS memecoin_rewards_claimed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stake_id UUID REFERENCES memecoin_stakes(id) ON DELETE CASCADE,
  token_id VARCHAR(255) NOT NULL,
  amount DECIMAL(78, 0) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_user ON memecoin_rewards_claimed(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_stake ON memecoin_rewards_claimed(stake_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_token ON memecoin_rewards_claimed(token_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_rewards_claimed_at ON memecoin_rewards_claimed(claimed_at DESC);

-- ================================================================
-- Initial Data: Configure supported tokens
-- ================================================================
INSERT INTO supported_staking_tokens (token_id, token_symbol, reward_rate, min_stake_amount, max_stake_amount, unstake_fee_percent, contract_address) VALUES
  -- Example tokens (these should be updated with actual contract addresses)
  ('pepe-token', 'PEPE', 100, 0, 1000000000000000000000000, 0, '0x...'), -- 1% daily APY
  ('doge-token', 'DOGE', 150, 0, 1000000000000000000000000, 0, '0x...'), -- 1.5% daily APY
  ('shib-token', 'SHIB', 80, 0, 1000000000000000000000000, 0, '0x...') -- 0.8% daily APY
ON CONFLICT (token_id) DO NOTHING;

-- ================================================================
-- Updated At Function
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables with updated_at columns
CREATE TRIGGER update_memecoin_stakes_updated_at BEFORE UPDATE ON memecoin_stakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supported_staking_tokens_updated_at BEFORE UPDATE ON supported_staking_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Helper Functions
-- ================================================================

-- Get user's total staked amount across all tokens
CREATE OR REPLACE FUNCTION get_user_total_staked(p_user_id UUID)
RETURNS DECIMAL(78, 0) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM memecoin_stakes
        WHERE user_id = p_user_id AND active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Get user's pending rewards across all tokens
CREATE OR REPLACE FUNCTION get_user_total_pending_rewards(p_user_id UUID)
RETURNS DECIMAL(78, 0) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(pending_karma), 0)
        FROM memecoin_stakes
        WHERE user_id = p_user_id AND active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Get total staked amount for a specific token
CREATE OR REPLACE FUNCTION get_token_total_staked(p_token_id VARCHAR)
RETURNS DECIMAL(78, 0) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM memecoin_stakes
        WHERE token_id = p_token_id AND active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Comments for documentation
-- ================================================================

COMMENT ON TABLE memecoin_stakes IS 'Stores memecoin staking positions where users stake memecoins to earn $KARMA rewards';

COMMENT ON TABLE memecoin_reward_distributions IS 'Tracks $KARMA reward distributions for memecoin staking pools';

COMMENT ON TABLE supported_staking_tokens IS 'Configuration for which tokens can be staked and their reward rates';

COMMENT ON TABLE memecoin_rewards_claimed IS 'Audit log of $KARMA rewards claimed by users from memecoin staking';

COMMENT ON COLUMN memecoin_stakes.token_price IS 'Token price in USD at time of staking (18 decimals), used for reward calculations';

COMMENT ON COLUMN memecoin_stakes.pending_karma IS 'Calculated but not yet claimed $KARMA rewards';

COMMENT ON COLUMN memecoin_stakes.claimed_karma IS 'Total $KARMA rewards already claimed by user';

COMMENT ON COLUMN supported_staking_tokens.reward_rate IS 'Daily reward rate in basis points (100 = 1% daily, resulting in ~365% APY)';

COMMENT ON COLUMN supported_staking_tokens.unstake_fee_percent IS 'Fee percentage charged when unstaking (0-100) to discourage short-term staking';
