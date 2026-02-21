import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Delete course (will cascade to batches and enrollments if FK is set to CASCADE)
    const { error: dbError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      
      // Check if it's a foreign key constraint error
      if (dbError.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete course with existing batches. Delete batches first or set them to inactive.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
