-- Migration: Add execution tracking tables for project management

-- Health status enum
CREATE TYPE health_status AS ENUM ('green', 'amber', 'red');

-- Task status enum
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Report type enum
CREATE TYPE report_type AS ENUM ('weekly', 'monthly', 'quarterly', 'milestone', 'custom');

-- Table: project_health_status
-- Tracks the RAG (Red/Amber/Green) health status of projects over time
CREATE TABLE project_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  health_status health_status NOT NULL,
  reason TEXT,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: project_weekly_updates
-- Weekly progress updates with challenges, initiatives, results, and blockers
CREATE TABLE project_weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  health_status health_status NOT NULL,
  challenges TEXT,
  key_initiatives TEXT,
  results_achieved TEXT,
  blockers TEXT,
  next_week_focus TEXT,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: project_milestone_updates
-- Track progress updates for individual milestones
CREATE TABLE project_milestone_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: project_indicator_updates
-- Track measurements and progress for indicators over time
CREATE TABLE project_indicator_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
  measured_value TEXT NOT NULL,
  measurement_date DATE NOT NULL,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: project_tasks
-- Key initiatives/tasks with assignments and completion tracking
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'not_started',
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: project_reports
-- Generated executive reports
CREATE TABLE project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  report_type report_type NOT NULL,
  period_start DATE,
  period_end DATE,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_project_health_project_id ON project_health_status(project_id);
CREATE INDEX idx_project_health_reported_at ON project_health_status(reported_at DESC);
CREATE INDEX idx_weekly_updates_project_id ON project_weekly_updates(project_id);
CREATE INDEX idx_weekly_updates_dates ON project_weekly_updates(week_start_date, week_end_date);
CREATE INDEX idx_milestone_updates_milestone_id ON project_milestone_updates(milestone_id);
CREATE INDEX idx_indicator_updates_indicator_id ON project_indicator_updates(indicator_id);
CREATE INDEX idx_indicator_updates_date ON project_indicator_updates(measurement_date DESC);
CREATE INDEX idx_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_tasks_status ON project_tasks(status);
CREATE INDEX idx_reports_project_id ON project_reports(project_id);

-- RLS Policies

-- project_health_status
ALTER TABLE project_health_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view health status of projects they have access to"
  ON project_health_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_health_status.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "CEOs and PMOs can insert health status"
  ON project_health_status FOR INSERT
  WITH CHECK (
    has_role('ceo', auth.uid()) OR has_role('pmo_manager', auth.uid())
  );

-- project_weekly_updates
ALTER TABLE project_weekly_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weekly updates of projects they have access to"
  ON project_weekly_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_weekly_updates.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can insert weekly updates"
  ON project_weekly_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_weekly_updates.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can update their own weekly updates"
  ON project_weekly_updates FOR UPDATE
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

-- project_milestone_updates
ALTER TABLE project_milestone_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestone updates of projects they have access to"
  ON project_milestone_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.id = project_milestone_updates.milestone_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can insert milestone updates"
  ON project_milestone_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_milestones pm
      JOIN projects p ON p.id = pm.project_id
      WHERE pm.id = project_milestone_updates.milestone_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

-- project_indicator_updates
ALTER TABLE project_indicator_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicator updates of projects they have access to"
  ON project_indicator_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_indicators pi
      JOIN projects p ON p.id = pi.project_id
      WHERE pi.id = project_indicator_updates.indicator_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can insert indicator updates"
  ON project_indicator_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_indicators pi
      JOIN projects p ON p.id = pi.project_id
      WHERE pi.id = project_indicator_updates.indicator_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

-- project_tasks
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of projects they have access to"
  ON project_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tasks.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can insert tasks"
  ON project_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tasks.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can update tasks"
  ON project_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tasks.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can delete tasks they created"
  ON project_tasks FOR DELETE
  USING (created_by = auth.uid());

-- project_reports
ALTER TABLE project_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports of projects they have access to"
  ON project_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_reports.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Team members can generate reports"
  ON project_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_reports.project_id
      AND user_has_project_access(p.id, auth.uid())
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weekly_updates_updated_at
  BEFORE UPDATE ON project_weekly_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments on tables
COMMENT ON TABLE project_health_status IS 'Tracks RAG (Red/Amber/Green) health status of projects over time';
COMMENT ON TABLE project_weekly_updates IS 'Weekly progress updates including challenges, initiatives, results, and blockers';
COMMENT ON TABLE project_milestone_updates IS 'Progress tracking for individual milestones';
COMMENT ON TABLE project_indicator_updates IS 'Historical measurements and progress for project indicators';
COMMENT ON TABLE project_tasks IS 'Key initiatives and tasks with assignment and completion tracking';
COMMENT ON TABLE project_reports IS 'Generated executive reports in various formats';
