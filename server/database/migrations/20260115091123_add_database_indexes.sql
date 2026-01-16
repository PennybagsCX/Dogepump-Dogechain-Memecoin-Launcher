-- Migration: add_database_indexes
-- Created: 2026-01-15T14:11:23.967Z

-- UP
-- This migration adds additional performance indexes for common query patterns
-- Most indexes already exist, this adds any that were missing

-- Additional composite index for comments (token + user lookup)
CREATE INDEX IF NOT EXISTS idx_comments_token_user ON comments(token_id, user_id);

-- Additional index for security events by type and user combined
CREATE INDEX IF NOT EXISTS idx_security_events_type_user ON security_events(event_type, user_id);

-- Additional index for audit logs by resource type and id
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Additional index for banned users (banned_at DESC for recent bans)
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_at ON banned_users(banned_at DESC);

-- Additional index for warned users (created_at DESC for recent warnings)
CREATE INDEX IF NOT EXISTS idx_warned_users_created_at ON warned_users(created_at DESC);

-- Additional index for reports by reviewed_by
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);

-- Additional index for reports by reported_user_id
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);

-- Additional index for image variants by name
CREATE INDEX IF NOT EXISTS idx_image_variants_name ON image_variants(name);

-- DOWN
-- Rollback the additional indexes

DROP INDEX IF EXISTS idx_image_variants_name;
DROP INDEX IF EXISTS idx_reports_reviewed_by;
DROP INDEX IF EXISTS idx_reports_reported_user_id;
DROP INDEX IF EXISTS idx_warned_users_created_at;
DROP INDEX IF EXISTS idx_banned_users_banned_at;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_security_events_type_user;
DROP INDEX IF EXISTS idx_comments_token_user;
