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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Check if batch has enrollments
    const { count: enrollmentCount } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id)

    if (enrollmentCount && enrollmentCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete batch with ${enrollmentCount} enrolled student(s)` },
        { status: 400 }
      )
    }

    // Delete batch (batch_finances will cascade delete automatically)
    const { error: deleteError } = await supabaseAdmin
      .from('batches')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete batch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
