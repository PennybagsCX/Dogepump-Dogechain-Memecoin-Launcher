-- Moderation System Schema
-- Migration: 002_moderation_system
-- Description: Create tables for 3-strike warning system, bans, and admin actions

-- Banned Users Table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  banned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ban_reason TEXT NOT NULL,
  admin_notes TEXT,
  is_automatic BOOLEAN DEFAULT false, -- true if auto-banned by 3-strike system
  is_active BOOLEAN DEFAULT true,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unbanned_at TIMESTAMP WITH TIME ZONE,
  unbanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warned Users Table
CREATE TABLE IF NOT EXISTS warned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  token_id VARCHAR(255), -- NULL if user-level warning, set if token-specific warning
  warned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  warning_reason TEXT NOT NULL,
  admin_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- 30 days from warned_at
  cleared_at TIMESTAMP WITH TIME ZONE,
  cleared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Actions Table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'warn_user',
    'ban_user',
    'unban_user',
    'delist_token',
    'relist_token',
    'clear_warning',
    'acknowledge_warning'
  )),
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('user', 'token')),
  target_id VARCHAR(255) NOT NULL, -- user_id or token_id
  target_wallet_address VARCHAR(255),
  reason TEXT NOT NULL,
  notes TEXT,
  metadata JSONB, -- Additional context (warning count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_wallet_address ON banned_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_at ON banned_users(banned_at DESC);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON banned_users(banned_by);

CREATE INDEX IF NOT EXISTS idx_warned_users_user_id ON warned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_warned_users_wallet_address ON warned_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_warned_users_token_id ON warned_users(token_id);
CREATE INDEX IF NOT EXISTS idx_warned_users_is_active ON warned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_warned_users_expires_at ON warned_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_warned_users_created_at ON warned_users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_warned_users_warned_by ON warned_users(warned_by);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE banned_users IS 'Stores banned user records with ban details and history';
COMMENT ON TABLE warned_users IS 'Stores user warnings with 3-strike tracking and expiration';
COMMENT ON TABLE admin_actions IS 'Audit log of all administrative actions';

COMMENT ON COLUMN banned_users.is_automatic IS 'True if banned by 3-strike system, false if manual ban';
COMMENT ON COLUMN warned_users.token_id IS 'NULL for user-level warnings, set for token-specific warnings';
COMMENT ON COLUMN warned_users.expires_at IS 'Warnings expire after 30 days';
COMMENT ON COLUMN admin_actions.metadata IS 'Additional context like warning count, strike number, etc.';
