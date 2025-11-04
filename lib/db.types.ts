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

