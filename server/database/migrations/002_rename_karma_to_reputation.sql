-- Migration: Rename KARMA to Reputation Points
-- Date: 2026-01-16
-- Description: Eliminates confusion between off-chain reputation points and planned $KARMA blockchain token

-- Step 1: Add new column
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0;

-- Step 2: Migrate existing data
UPDATE users SET reputation_points = karma WHERE karma IS NOT NULL;

-- Step 3: Create audit log table
CREATE TABLE IF NOT EXISTS reputation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_points INTEGER NOT NULL,
  new_points INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'token_lock', 'token_unlock', 'airdrop_received', 'admin_adjustment'
  token_id VARCHAR(255),
  token_amount DECIMAL(20, 8),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add constraint to prevent negative values
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_reputation_non_negative
  CHECK (reputation_points >= 0);

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_reputation_points ON users(reputation_points DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_audit_user_id ON reputation_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_audit_created_at ON reputation_audit_log(created_at DESC);

-- Step 6: Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Drop old column (will be done in separate migration after verification)
-- ALTER TABLE users DROP COLUMN karma; -- TODO: Execute in migration 003 after verification
