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
