-- Add denormalized podcast fields to episodes table
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS podcast_cover TEXT,
ADD COLUMN IF NOT EXISTS podcast_title TEXT,
ADD COLUMN IF NOT EXISTS summary_count INTEGER DEFAULT 0;

-- Populate podcast_cover and podcast_title from related podcasts
UPDATE episodes e
SET 
  podcast_cover = p.cover_image_url,
  podcast_title = p.title
FROM podcasts p
WHERE e.podcast_id = p.id;

-- Update summary_count for all episodes
UPDATE episodes e
SET summary_count = (
  SELECT COUNT(*)
  FROM summaries s
  WHERE s.episode_id = e.id
);



