-- Add image_url field to courses table
-- Run this migration to add course image support

ALTER TABLE courses 
ADD COLUMN image_url TEXT;

COMMENT ON COLUMN courses.image_url IS 'URL to course cover image (optional)';

-- Update existing courses with placeholder images (you can replace these with real images later)
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop' WHERE slug = 'python-fundamentals';
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop' WHERE slug = 'react-nextjs-mastery';
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop' WHERE slug = 'flutter-mobile-dev';
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop' WHERE slug = 'web-dev-basics';
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&auto=format&fit=crop' WHERE slug = 'django-framework';
UPDATE courses SET image_url = 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop' WHERE slug = 'dsa-python';

-- Success message
SELECT 'Image URL field added successfully!' as status;
