import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Type definitions for database tables
export type Organization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website: string | null
  created_at: Date
  updated_at: Date
}

export type User = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: "admin" | "creator" | "viewer"
  organization_id: string
  created_at: Date
  updated_at: Date
}

export type Podcast = {
  id: string
  organization_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  rss_feed_url: string | null
  website_url: string | null
  author: string | null
  category: string | null
  language: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type Episode = {
  id: string
  podcast_id: string
  title: string
  description: string | null
  audio_url: string
  duration_seconds: number | null
  file_size_bytes: number | null
  episode_number: number | null
  season_number: number | null
  published_at: Date | null
  transcript: string | null
  processing_status: "pending" | "processing" | "completed" | "failed"
  created_at: Date
  updated_at: Date
}

export type Summary = {
  id: string
  episode_id: string
  summary_type: "full" | "highlight" | "social_twitter" | "social_linkedin" | "social_instagram" | "show_notes"
  content: string
  metadata: Record<string, any>
  view_count: number
  share_count: number
  created_at: Date
  updated_at: Date
}

export type License = {
  id: string
  organization_id: string
  license_type: "b2b_only" | "b2b_b2c"
  terms_version: string
  signed_at: Date
  signed_by_user_id: string | null
  is_active: boolean
  tdm_opt_out: boolean
  custom_terms: Record<string, any>
  created_at: Date
  updated_at: Date
}

export type Royalty = {
  id: string
  organization_id: string
  period_start: Date
  period_end: Date
  total_views: number
  total_shares: number
  calculated_amount: number
  payment_status: "pending" | "processing" | "paid" | "failed"
  paid_at: Date | null
  stripe_payout_id: string | null
  created_at: Date
  updated_at: Date
}

export type AnalyticsEvent = {
  id: string
  summary_id: string
  event_type: "view" | "share" | "click" | "download"
  metadata: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  created_at: Date
}

export type Clip = {
  id: string
  episode_id: string
  title: string
  start_time_seconds: number
  end_time_seconds: number
  audio_url: string | null
  processing_status: "pending" | "processing" | "completed" | "failed"
  created_at: Date
  updated_at: Date
}
