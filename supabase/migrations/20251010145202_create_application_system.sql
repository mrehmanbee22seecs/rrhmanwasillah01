/*
  # Enhanced Project/Event Application System with 3-Section Architecture

  ## Overview
  This migration creates a comprehensive application system for projects/events with:
  - 3-section form structure (Public, Detailed, Admin-only)
  - Dynamic custom fields per section
  - Role-based access control
  - Application submission tracking
  
  ## New Tables
  
  ### `user_roles`
  Manages user permissions and roles
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `role` (text: 'admin', 'user', 'applicant')
  - `created_at` (timestamp)
  
  ### `application_templates`
  Defines project/event application templates with section structure
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text)
  - `is_active` (boolean)
  - `created_by` (uuid, references auth.users)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
  
  ### `template_fields`
  Custom fields for each section of the application template
  - `id` (uuid, primary key)
  - `template_id` (uuid, references application_templates)
  - `section` (text: 'section1', 'section2', 'section3')
  - `field_name` (text)
  - `field_label` (text)
  - `field_type` (text: 'text', 'textarea', 'number', 'date', 'select', 'checkbox')
  - `field_options` (jsonb) - For select/checkbox options
  - `is_required` (boolean)
  - `display_order` (integer)
  - `placeholder` (text)
  - `validation_rules` (jsonb)
  - `created_at` (timestamp)
  
  ### `applications`
  Submitted project/event applications
  - `id` (uuid, primary key)
  - `template_id` (uuid, references application_templates)
  - `applicant_id` (uuid, references auth.users)
  - `title` (text) - Project/Event title
  - `status` (text: 'draft', 'submitted', 'under_review', 'approved', 'rejected')
  - `section1_data` (jsonb) - Public information
  - `section2_data` (jsonb) - Detailed information
  - `section3_data` (jsonb) - Admin-only information
  - `visibility` (text: 'public', 'private', 'archived')
  - `submitted_at` (timestamp)
  - `reviewed_at` (timestamp)
  - `reviewed_by` (uuid, references auth.users)
  - `admin_notes` (text)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
  
  ### `application_comments`
  Comments and feedback on applications
  - `id` (uuid, primary key)
  - `application_id` (uuid, references applications)
  - `user_id` (uuid, references auth.users)
  - `comment` (text)
  - `is_internal` (boolean) - Admin-only comments
  - `created_at` (timestamp)
  
  ## Security
  - Enable RLS on all tables
  - Public can view Section 1 data of approved applications
  - Authenticated users can view Section 1 & 2 of approved applications
  - Admins can view all sections and manage applications
  - Applicants can view/edit their own drafts
  
  ## Indexes
  - Index on application status for filtering
  - Index on applicant_id for user-specific queries
  - Index on template_id for template-based queries
  - Index on section and display_order for field ordering
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user', 'applicant')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create application_templates table
CREATE TABLE IF NOT EXISTS application_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create template_fields table
CREATE TABLE IF NOT EXISTS template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES application_templates(id) ON DELETE CASCADE NOT NULL,
  section text NOT NULL CHECK (section IN ('section1', 'section2', 'section3')),
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'checkbox', 'multiselect', 'file')),
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  placeholder text DEFAULT '',
  validation_rules jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(template_id, section, field_name)
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES application_templates(id) ON DELETE SET NULL,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  section1_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  section2_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  section3_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  visibility text DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'private', 'archived')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create application_comments table
CREATE TABLE IF NOT EXISTS application_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_section ON template_fields(section, display_order);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_template_id ON applications(template_id);
CREATE INDEX IF NOT EXISTS idx_applications_visibility ON applications(visibility);
CREATE INDEX IF NOT EXISTS idx_application_comments_application_id ON application_comments(application_id);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for application_templates
CREATE POLICY "Anyone can view active templates"
  ON application_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all templates"
  ON application_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage templates"
  ON application_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for template_fields
CREATE POLICY "Anyone can view fields of active templates"
  ON template_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM application_templates
      WHERE id = template_id AND is_active = true
    )
  );

CREATE POLICY "Admins can view all fields"
  ON template_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage fields"
  ON template_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for applications
CREATE POLICY "Public can view Section 1 of approved applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    status = 'approved' AND visibility = 'public'
  );

CREATE POLICY "Applicants can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update their draft applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id AND status = 'draft')
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Admins can update any application"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete applications"
  ON applications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for application_comments
CREATE POLICY "Users can view public comments on applications they can see"
  ON application_comments FOR SELECT
  TO authenticated
  USING (
    NOT is_internal AND (
      EXISTS (
        SELECT 1 FROM applications
        WHERE id = application_id
        AND (applicant_id = auth.uid() OR status = 'approved')
      )
    )
  );

CREATE POLICY "Admins can view all comments"
  ON application_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can add comments"
  ON application_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments"
  ON application_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_application_templates_updated_at
  BEFORE UPDATE ON application_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default template with standard fields
INSERT INTO application_templates (name, description, is_active)
VALUES (
  'Project/Event Application',
  'Standard template for project and event applications with 3-section structure',
  true
) ON CONFLICT DO NOTHING;

-- Get the template ID for inserting fields
DO $$
DECLARE
  template_uuid uuid;
BEGIN
  SELECT id INTO template_uuid FROM application_templates WHERE name = 'Project/Event Application' LIMIT 1;
  
  IF template_uuid IS NOT NULL THEN
    -- Section 1 fields (Public Information)
    INSERT INTO template_fields (template_id, section, field_name, field_label, field_type, is_required, display_order, placeholder)
    VALUES
      (template_uuid, 'section1', 'category', 'Category', 'select', true, 1, 'Select category'),
      (template_uuid, 'section1', 'location', 'Location', 'text', true, 2, 'e.g., Karachi'),
      (template_uuid, 'section1', 'short_description', 'Short Description', 'textarea', true, 3, 'Brief overview (max 150 characters)'),
      (template_uuid, 'section1', 'volunteers_needed', 'Volunteers Needed', 'number', true, 4, 'Number of volunteers'),
      (template_uuid, 'section1', 'duration', 'Duration', 'text', true, 5, 'e.g., 12 months'),
      (template_uuid, 'section1', 'people_impacted', 'People Impacted', 'number', true, 6, 'Estimated number'),
      (template_uuid, 'section1', 'deadline', 'Application Deadline', 'date', true, 7, 'YYYY-MM-DD')
    ON CONFLICT DO NOTHING;
    
    -- Section 2 fields (Detailed Information)
    INSERT INTO template_fields (template_id, section, field_name, field_label, field_type, is_required, display_order, placeholder)
    VALUES
      (template_uuid, 'section2', 'full_description', 'Full Description', 'textarea', true, 1, 'Detailed project description'),
      (template_uuid, 'section2', 'objectives', 'Project Objectives', 'textarea', true, 2, 'List main objectives'),
      (template_uuid, 'section2', 'target_audience', 'Target Audience', 'textarea', true, 3, 'Who will benefit?'),
      (template_uuid, 'section2', 'timeline', 'Implementation Timeline', 'textarea', true, 4, 'Detailed timeline'),
      (template_uuid, 'section2', 'volunteer_roles', 'Volunteer Roles & Responsibilities', 'textarea', true, 5, 'Describe roles needed'),
      (template_uuid, 'section2', 'required_skills', 'Required Skills', 'textarea', false, 6, 'Any special skills needed'),
      (template_uuid, 'section2', 'impact_metrics', 'Expected Impact & Metrics', 'textarea', true, 7, 'How will success be measured?'),
      (template_uuid, 'section2', 'sustainability_plan', 'Sustainability Plan', 'textarea', false, 8, 'Long-term sustainability')
    ON CONFLICT DO NOTHING;
    
    -- Section 3 fields (Admin-Only Information)
    INSERT INTO template_fields (template_id, section, field_name, field_label, field_type, is_required, display_order, placeholder)
    VALUES
      (template_uuid, 'section3', 'total_budget', 'Total Budget', 'number', true, 1, 'Amount in local currency'),
      (template_uuid, 'section3', 'budget_breakdown', 'Budget Breakdown', 'textarea', true, 2, 'Itemized budget'),
      (template_uuid, 'section3', 'funding_sources', 'Funding Sources', 'textarea', true, 3, 'Where is funding coming from?'),
      (template_uuid, 'section3', 'organization_background', 'Organization Background', 'textarea', true, 4, 'Details about your organization'),
      (template_uuid, 'section3', 'key_personnel', 'Key Personnel', 'textarea', true, 5, 'Team members and roles'),
      (template_uuid, 'section3', 'risk_assessment', 'Risk Assessment', 'textarea', true, 6, 'Potential risks and mitigation'),
      (template_uuid, 'section3', 'partnership_details', 'Partnership Details', 'textarea', false, 7, 'Any collaborating organizations'),
      (template_uuid, 'section3', 'legal_compliance', 'Legal & Compliance', 'textarea', true, 8, 'Permits, licenses, compliance'),
      (template_uuid, 'section3', 'internal_notes', 'Internal Notes', 'textarea', false, 9, 'For admin use only')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;