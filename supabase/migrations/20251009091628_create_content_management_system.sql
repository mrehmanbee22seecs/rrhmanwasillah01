/*
  # Content Management System

  ## Purpose
  Create a flexible content management system to store editable page content,
  including team member profiles and other dynamic sections.

  ## Tables Created
  
  ### `content`
  Stores all editable content across the website, organized by section and slug.
  
  - `id` (uuid, primary key) - Unique identifier
  - `section` (text, not null) - Content section (e.g., 'about_team', 'about_values')
  - `slug` (text, not null) - Unique identifier within section (e.g., 'main', or auto-generated)
  - `data` (jsonb, not null) - Flexible JSON data structure for content
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - User who created the content
  - `updated_by` (uuid) - User who last updated the content

  ## Indexes
  - Composite index on (section, slug) for fast lookups
  - Index on created_at for sorting

  ## Security
  - Enable RLS
  - Public can read all content
  - Only authenticated users can create/update/delete content
*/

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  slug text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE(section, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_section_slug ON content(section, slug);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_section ON content(section);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Public can read all content
CREATE POLICY "Anyone can view content"
  ON content
  FOR SELECT
  USING (true);

-- Authenticated users can insert content
CREATE POLICY "Authenticated users can create content"
  ON content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update content
CREATE POLICY "Authenticated users can update content"
  ON content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete content
CREATE POLICY "Authenticated users can delete content"
  ON content
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
