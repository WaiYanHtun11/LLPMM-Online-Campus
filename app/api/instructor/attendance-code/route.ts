import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { batchId, code, instructorId, validUntil, notes } = await request.json()

    // Validate required fields
    if (!batchId || !code || !instructorId || !validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('attendance_codes')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This code already exists. Please generate a new one.' },
        { status: 400 }
      )
    }

    // Insert attendance code
    const { data, error } = await supabase
      .from('attendance_codes')
      .insert({
        batch_id: batchId,
        code: code,
        generated_by: instructorId,
        valid_until: validUntil,
        is_active: true,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error: any) {
    console.error('Generate attendance code error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save attendance code' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { codeId, instructorId } = await request.json()

    if (!codeId || !instructorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: codeRecord, error: fetchError } = await supabase
      .from('attendance_codes')
      .select('id, batch_id, generated_by')
      .eq('id', codeId)
      .single()

    if (fetchError || !codeRecord) {
      return NextResponse.json(
        { error: 'Attendance code not found' },
        { status: 404 }
      )
    }

    const { data: batchRecord, error: batchError } = await supabase
      .from('batches')
      .select('id, instructor_id')
      .eq('id', codeRecord.batch_id)
      .single()

    if (batchError || !batchRecord) {
      return NextResponse.json(
        { error: 'Batch not found for this attendance code' },
        { status: 404 }
      )
    }

    const isCodeOwner = codeRecord.generated_by === instructorId
    const isBatchOwner = batchRecord.instructor_id === instructorId

    if (!isCodeOwner && !isBatchOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this attendance code' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('attendance_codes')
      .delete()
      .eq('id', codeId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete attendance code error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete attendance code' },
      { status: 500 }
    )
  }
}
