-- Drop the old check constraint
ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_event_type_check";

-- Add the new check constraint with play, pause, and complete
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_event_type_check" 
  CHECK (event_type IN ('view', 'share', 'click', 'download', 'play', 'pause', 'complete'));
