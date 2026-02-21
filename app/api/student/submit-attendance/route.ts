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
    const { code, studentId } = await request.json()
    console.log('[API] Submit attendance request:', { code, studentId })

    // Validate required fields
    if (!code || !studentId) {
      console.log('[API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the attendance code
    console.log('[API] Looking for code:', code.toUpperCase())
    const { data: attendanceCode, error: codeError } = await supabase
      .from('attendance_codes')
      .select('id, batch_id, valid_until, is_active')
      .eq('code', code.toUpperCase())
      .single()

    console.log('[API] Code lookup result:', { attendanceCode, codeError })

    if (codeError || !attendanceCode) {
      console.log('[API] Code not found or error:', codeError)
      return NextResponse.json(
        { error: 'Invalid attendance code. Please check and try again.' },
        { status: 400 }
      )
    }

    // Check if code is active
    if (!attendanceCode.is_active) {
      console.log('[API] Code is not active')
      return NextResponse.json(
        { error: 'This attendance code has been deactivated.' },
        { status: 400 }
      )
    }

    // Check if code is expired
    const now = new Date()
    const validUntil = new Date(attendanceCode.valid_until)
    console.log('[API] Expiry check:', { now, validUntil, expired: now > validUntil })
    if (now > validUntil) {
      console.log('[API] Code has expired')
      return NextResponse.json(
        { error: 'This attendance code has expired.' },
        { status: 400 }
      )
    }

    // Check if student is enrolled in this batch
    console.log('[API] Checking enrollment:', { studentId, batchId: attendanceCode.batch_id })
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('batch_id', attendanceCode.batch_id)
      .single()

    console.log('[API] Enrollment check result:', { enrollment, enrollmentError })

    if (enrollmentError || !enrollment) {
      console.log('[API] Student not enrolled:', enrollmentError)
      return NextResponse.json(
        { error: 'You are not enrolled in this batch.' },
        { status: 400 }
      )
    }

    // Check if student has already submitted this code
    console.log('[API] Checking for duplicate submission')
    const { data: existingSubmission, error: dupError } = await supabase
      .from('attendance_submissions')
      .select('id')
      .eq('attendance_code_id', attendanceCode.id)
      .eq('student_id', studentId)
      .single()

    console.log('[API] Duplicate check result:', { existingSubmission, dupError })

    if (existingSubmission) {
      console.log('[API] Duplicate submission found')
      return NextResponse.json(
        { error: 'You have already submitted this attendance code.' },
        { status: 400 }
      )
    }

    // Create attendance submission
    console.log('[API] Inserting submission:', {
      attendance_code_id: attendanceCode.id,
      student_id: studentId,
      batch_id: attendanceCode.batch_id
    })
    
    const { data: submission, error: submissionError } = await supabase
      .from('attendance_submissions')
      .insert({
        attendance_code_id: attendanceCode.id,
        student_id: studentId,
        batch_id: attendanceCode.batch_id
      })
      .select()
      .single()

    console.log('[API] Insertion result:', { submission, submissionError })

    if (submissionError) {
      console.error('[API] Submission insert error:', submissionError)
      throw submissionError
    }

    console.log('[API] Success! Submission created:', submission)
    return NextResponse.json({
      success: true,
      message: 'Attendance submitted successfully!',
      data: submission
    })

  } catch (error: any) {
    console.error('[API] Submit attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit attendance' },
      { status: 500 }
    )
  }
}
