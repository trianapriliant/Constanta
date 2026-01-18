-- Create class_links table for storing external resources
CREATE TABLE IF NOT EXISTS class_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE class_links ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view links
CREATE POLICY "Class members can view links"
  ON class_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_members
      WHERE class_members.class_id = class_links.class_id
      AND class_members.user_id = auth.uid()
      AND class_members.status = 'active'
    )
  );

-- Policy: Teachers/Owners can insert links
CREATE POLICY "Teachers can insert links"
  ON class_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_members
      WHERE class_members.class_id = class_links.class_id
      AND class_members.user_id = auth.uid()
      AND class_members.role IN ('owner', 'teacher')
      AND class_members.status = 'active'
    )
  );

-- Policy: Teachers/Owners can update links
CREATE POLICY "Teachers can update links"
  ON class_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM class_members
      WHERE class_members.class_id = class_links.class_id
      AND class_members.user_id = auth.uid()
      AND class_members.role IN ('owner', 'teacher')
      AND class_members.status = 'active'
    )
  );

-- Policy: Teachers/Owners can delete links
CREATE POLICY "Teachers can delete links"
  ON class_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM class_members
      WHERE class_members.class_id = class_links.class_id
      AND class_members.user_id = auth.uid()
      AND class_members.role IN ('owner', 'teacher')
      AND class_members.status = 'active'
    )
  );
