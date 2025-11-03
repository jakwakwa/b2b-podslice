-- Script to calculate royalties for a specific period
-- This would typically be run as a scheduled job

DO $$
DECLARE
  org RECORD;
  period_start DATE;
  period_end DATE;
  total_views INTEGER;
  total_shares INTEGER;
  calculated_amount DECIMAL(10, 2);
BEGIN
  -- Set period to last month
  period_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  period_end := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';

  -- Loop through all organizations
  FOR org IN SELECT id FROM organizations LOOP
    -- Calculate totals for the organization
    SELECT 
      COALESCE(SUM(s.view_count), 0),
      COALESCE(SUM(s.share_count), 0)
    INTO total_views, total_shares
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = org.id
      AND s.created_at >= period_start
      AND s.created_at <= period_end;

    -- Calculate amount (views * $0.001 + shares * $0.01)
    calculated_amount := (total_views * 0.001) + (total_shares * 0.01);

    -- Only create royalty record if there's activity
    IF total_views > 0 OR total_shares > 0 THEN
      INSERT INTO royalties (
        organization_id,
        period_start,
        period_end,
        total_views,
        total_shares,
        calculated_amount,
        payment_status
      )
      VALUES (
        org.id,
        period_start,
        period_end,
        total_views,
        total_shares,
        calculated_amount,
        CASE WHEN calculated_amount >= 10 THEN 'pending' ELSE 'pending' END
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
