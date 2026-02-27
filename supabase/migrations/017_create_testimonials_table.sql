-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  course_name TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  testimonial_date TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'approved' CHECK (LOWER(status) IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add batch_name column if it doesn't exist (for existing tables)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'testimonials' AND column_name = 'batch_name'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN batch_name TEXT NOT NULL DEFAULT 'Unknown Batch';
    -- Remove default after adding the column
    ALTER TABLE testimonials ALTER COLUMN batch_name DROP DEFAULT;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);

-- Drop old unique constraint if it exists (without batch_name)
DROP INDEX IF EXISTS idx_unique_testimonial_per_course;

-- Create unique constraint to ensure one testimonial per student per batch
DROP INDEX IF EXISTS idx_unique_testimonial_per_batch;
CREATE UNIQUE INDEX idx_unique_testimonial_per_batch 
ON testimonials(student_name, batch_name, course_name, instructor_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_testimonials_updated_at ON testimonials;
CREATE TRIGGER trigger_update_testimonials_updated_at
BEFORE UPDATE ON testimonials
FOR EACH ROW
EXECUTE FUNCTION update_testimonials_updated_at();

-- Insert sample testimonials
INSERT INTO testimonials (student_name, instructor_name, rating, testimonial_text, course_name, batch_name, testimonial_date, is_featured, status) VALUES
('Aung Aung', 'Ko Kyaw Zin', 5, 'LLPMM courses completely transformed my career. The practical approach and real-world projects helped me land my dream job as a Full Stack Developer. The instructors are incredibly knowledgeable and supportive.', 'Python & Django Full Stack', 'Python Batch 1', 'January 2024', true, 'approved'),
('Wai Yan Htun', 'Ko Kyaw Zin', 5, 'The React course at LLPMM is outstanding! The teaching style is clear, and the projects are industry-relevant. I went from zero knowledge to building professional applications in just a few months.', 'React & Modern JavaScript', 'React Batch 2', 'December 2023', true, 'approved'),
('Thiha Kyaw', 'Daw Aye Aye', 5, 'Flutter course exceeded my expectations. The instructor''s expertise and the community support made learning enjoyable. Now I am building mobile apps professionally!', 'Flutter Mobile Development', 'Flutter Batch 1', 'February 2024', true, 'approved'),
('Su Mon', 'Ko Kyaw Zin', 5, 'The Python fundamentals and Django courses gave me a solid foundation. The teaching methods are practical and easy to follow. Highly recommended for anyone serious about programming!', 'Python Programming', 'Python Fundamentals Batch 3', 'November 2023', true, 'approved'),
('Zaw Win', 'Ko Min Khant', 5, 'LLPMM provided me with all the skills I needed to become a professional frontend developer. The course content is up-to-date and industry-relevant. Best investment in my career!', 'Web Development Bootcamp', 'Web Dev Batch 5', 'March 2024', true, 'approved'),
('May Thu', 'Daw Su Su', 5, 'The UI/UX course opened my eyes to design thinking and user-centered design. The practical projects and feedback sessions were invaluable. Thank you LLPMM!', 'UI/UX Design', 'UI/UX Batch 2', 'January 2024', true, 'approved')
ON CONFLICT (student_name, batch_name, course_name, instructor_name) DO NOTHING;

-- Add RLS (Row Level Security) policies
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can do everything with testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can submit testimonials" ON testimonials;

-- Allow public to read approved testimonials
CREATE POLICY "Public can view approved testimonials"
ON testimonials FOR SELECT
USING (status = 'approved');

-- Allow admins to do everything
CREATE POLICY "Admins can do everything with testimonials"
ON testimonials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow authenticated users to insert testimonials (for future student submission feature)
CREATE POLICY "Authenticated users can submit testimonials"
ON testimonials FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
