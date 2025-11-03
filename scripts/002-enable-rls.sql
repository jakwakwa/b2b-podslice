-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization"
  ON users FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for podcasts
CREATE POLICY "Users can view podcasts in their organization"
  ON podcasts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Creators and admins can manage podcasts"
  ON podcasts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'creator')
    )
  );

-- RLS Policies for episodes
CREATE POLICY "Users can view episodes from their organization's podcasts"
  ON episodes FOR SELECT
  USING (
    podcast_id IN (
      SELECT p.id FROM podcasts p
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Creators and admins can manage episodes"
  ON episodes FOR ALL
  USING (
    podcast_id IN (
      SELECT p.id FROM podcasts p
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'creator')
    )
  );

-- RLS Policies for summaries
CREATE POLICY "Users can view summaries from their organization"
  ON summaries FOR SELECT
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      INNER JOIN podcasts p ON p.id = e.podcast_id
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "System can insert summaries"
  ON summaries FOR INSERT
  WITH CHECK (true);

-- RLS Policies for licenses
CREATE POLICY "Users can view their organization's licenses"
  ON licenses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage licenses"
  ON licenses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for royalties
CREATE POLICY "Users can view their organization's royalties"
  ON royalties FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for analytics
CREATE POLICY "Users can view analytics for their organization"
  ON analytics_events FOR SELECT
  USING (
    summary_id IN (
      SELECT s.id FROM summaries s
      INNER JOIN episodes e ON e.id = s.episode_id
      INNER JOIN podcasts p ON p.id = e.podcast_id
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Public can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for clips
CREATE POLICY "Users can view clips from their organization"
  ON clips FOR SELECT
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      INNER JOIN podcasts p ON p.id = e.podcast_id
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Creators and admins can manage clips"
  ON clips FOR ALL
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      INNER JOIN podcasts p ON p.id = e.podcast_id
      INNER JOIN users u ON u.organization_id = p.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'creator')
    )
  );
