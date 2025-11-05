import type {
	analytics_eventsModel,
	clipsModel,
	daily_analyticsModel,
	episodesModel,
	licensesModel,
	password_reset_tokensModel,
	podcastsModel,
	royalty_line_itemsModel,
	sessionsModel,
	summariesModel,
	usersModel,
	waiting_listModel,
} from "@/app/generated/prisma/models";

export type Organization = {
	id: string;
	name: string;
	slug: string;
	logo_url: string | null;
	website: string | null;
	payoneer_payee_id: string | null;
	payout_status: string;
	tax_form_status: string;
	content_source_id: string | null;
	created_at: Date;
	updated_at: Date;
};

export type Royalty = {
	id: string;
	organization_id: string;
	period_start: Date;
	period_end: Date;
	total_views: number;
	total_shares: number;
	calculated_amount: number;
	payment_status: "pending" | "processing" | "paid" | "failed";
	paid_at: Date | null;
	payoneer_transaction_id: string | null;
	created_at: Date;
	updated_at: Date;
};

export type IWaitingList = {
	id: string;
	email: string;
	name?: string | "anonymous";
	created_at: Date;
};

export interface Episode extends episodesModel {
	summary_count: number;
}

export type Podcast = podcastsModel;

export type Summary = summariesModel;

export type Clip = clipsModel;

export type DailyAnalytics = daily_analyticsModel;

export type AnalyticsEvent = analytics_eventsModel;

export type WaitingList = waiting_listModel;

export type PasswordResetToken = password_reset_tokensModel;

export type Session = sessionsModel;

export type User = usersModel;

export type License = licensesModel;

export type RoyaltyLineItem = royalty_line_itemsModel;

export enum Tab {
	PodcastAnalyzer = "Podcast Analyzer",
	LiveTranscriber = "Live Transcriber",
}

export interface PodcastAnalysisResult {
	summary: string;
	chapters: { timestamp: string; title: string }[];
	socialMediaPosts: { platform: string; content: string; imageUrl?: string }[];
}

// Fix: Add AspectRatio type for video generation.
export type AspectRatio = "16:9" | "9:16";
