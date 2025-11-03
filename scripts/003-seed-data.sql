-- Insert demo organization
INSERT INTO organizations (id, name, slug, website)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Podcast Network', 'demo-network', 'https://demo-network.com')
ON CONFLICT (id) DO NOTHING;

-- Insert demo podcasts
INSERT INTO podcasts (id, organization_id, title, description, category, language)
VALUES 
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Tech Talk Daily',
    'Your daily dose of technology news and insights',
    'Technology',
    'en'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'Business Insights',
    'Deep dives into business strategy and entrepreneurship',
    'Business',
    'en'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert demo episodes
INSERT INTO episodes (id, podcast_id, title, description, audio_url, duration_seconds, processing_status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000011',
    'The Future of AI in 2025',
    'Exploring the latest developments in artificial intelligence',
    'https://example.com/audio/episode1.mp3',
    3600,
    'completed'
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000011',
    'Cloud Computing Trends',
    'What every developer needs to know about cloud infrastructure',
    'https://example.com/audio/episode2.mp3',
    2700,
    'completed'
  ),
  (
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000012',
    'Startup Funding Strategies',
    'How to raise capital for your startup in 2025',
    'https://example.com/audio/episode3.mp3',
    4200,
    'completed'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert demo summaries
INSERT INTO summaries (episode_id, summary_type, content, view_count, share_count)
VALUES 
  (
    '00000000-0000-0000-0000-000000000021',
    'full',
    'This episode explores the cutting-edge developments in AI technology for 2025, including advances in large language models, computer vision, and autonomous systems. Key topics include ethical considerations, regulatory frameworks, and practical applications across industries.',
    1250,
    45
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    'social_twitter',
    '🤖 Just dropped: The Future of AI in 2025! Exploring LLMs, computer vision, and what it means for your business. Listen now! #AI #Technology #Podcast',
    320,
    78
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    'full',
    'A comprehensive guide to cloud computing trends, covering serverless architecture, edge computing, multi-cloud strategies, and cost optimization techniques. Perfect for developers and CTOs planning their infrastructure roadmap.',
    890,
    32
  ),
  (
    '00000000-0000-0000-0000-000000000023',
    'full',
    'Learn proven strategies for raising startup capital, from angel investors to venture capital. This episode covers pitch deck essentials, valuation negotiations, and common mistakes to avoid when seeking funding.',
    1450,
    67
  )
ON CONFLICT DO NOTHING;
