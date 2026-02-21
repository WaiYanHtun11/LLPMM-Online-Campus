import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recalculateInstructorSalary } from '@/lib/server/recalculate-instructor-salary'

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      )
    }

    // Check if enrollment exists
    const { data: enrollment, error: checkError } = await supabaseAdmin
      .from('enrollments')
      .select('id, batch_id')
      .eq('id', id)
      .single()

    if (checkError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Delete enrollment (payments will cascade delete automatically)
    const { error: deleteError } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete enrollment error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    await recalculateInstructorSalary(supabaseAdmin, enrollment.batch_id)

    return NextResponse.json({
      success: true,
      message: 'Student unenrolled successfully'
    })

  } catch (error: any) {
    console.error('Unenroll student error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unenroll student' },
      { status: 500 }
    )
  }
}
