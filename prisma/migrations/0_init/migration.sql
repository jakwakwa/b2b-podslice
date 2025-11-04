-- Organizations (Podcast Networks/Creators)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  payoneer_payee_id TEXT UNIQUE,
  payout_status TEXT DEFAULT 'PENDING',
  tax_form_status TEXT DEFAULT 'NONE',
  content_source_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with role-based access and authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('admin', 'creator', 'viewer')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session tokens for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcasts
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  rss_feed_url TEXT,
  website_url TEXT,
  author TEXT,
  category TEXT,
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  episode_number INTEGER,
  season_number INTEGER,
  published_at TIMESTAMPTZ,
  transcript TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated summaries
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('full', 'highlight', 'social_twitter', 'social_linkedin', 'social_instagram', 'show_notes')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Licensing agreements
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL CHECK (license_type IN ('b2b_only', 'b2b_b2c')),
  terms_version TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  signed_by_user_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  tdm_opt_out BOOLEAN DEFAULT false,
  custom_terms JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Royalty tracking
CREATE TABLE IF NOT EXISTS royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  calculated_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  payoneer_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Royalty line items (detailed breakdown)
CREATE TABLE IF NOT EXISTS royalty_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  royalty_id UUID NOT NULL REFERENCES royalties(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'share', 'click', 'download')),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio clips
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  audio_url TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_unique ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_tokens_token_unique ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_podcasts_organization ON podcasts(organization_id);
CREATE INDEX IF NOT EXISTS idx_episodes_podcast ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(processing_status);
CREATE INDEX IF NOT EXISTS idx_summaries_episode ON summaries(episode_id);
CREATE INDEX IF NOT EXISTS idx_summaries_type ON summaries(summary_type);
CREATE INDEX IF NOT EXISTS idx_licenses_organization ON licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_royalties_organization ON royalties(organization_id);
CREATE INDEX IF NOT EXISTS idx_royalties_status ON royalties(payment_status);
CREATE INDEX IF NOT EXISTS idx_analytics_summary ON analytics_events(summary_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_clips_episode ON clips(episode_id);
