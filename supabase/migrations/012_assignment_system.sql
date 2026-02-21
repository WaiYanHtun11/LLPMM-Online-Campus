-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  instructor_id UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('code', 'image')),
  code_content TEXT,
  code_language VARCHAR(50),
  image_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  feedback TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_assignments_batch ON assignments(batch_id);
CREATE INDEX idx_assignments_instructor ON assignments(instructor_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);

-- Add comments
COMMENT ON TABLE assignments IS 'Assignments created by instructors for batches';
COMMENT ON TABLE assignment_submissions IS 'Student submissions for assignments (code or images)';
COMMENT ON COLUMN assignment_submissions.submission_type IS 'Type: code or image';
COMMENT ON COLUMN assignment_submissions.code_language IS 'Programming language for syntax highlighting (python, javascript, etc.)';

-- Disable RLS for development (can be enabled later with proper policies)
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;
