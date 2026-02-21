import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const enrollmentId = formData.get('enrollmentId') as string | null

    if (!file || !enrollmentId) {
      return NextResponse.json({ error: 'File and enrollmentId are required' }, { status: 400 })
    }

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, PNG, and JPG certificates are allowed' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id, batch_id')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const extension = file.name.split('.').pop() || 'pdf'
    const filename = `${enrollmentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = supabaseAdmin.storage.from('certificates').getPublicUrl(filename)

    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        certificate_url: publicData.publicUrl,
        certificate_source: 'uploaded',
        certificate_issued_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicData.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Certificate upload failed' }, { status: 500 })
  }
}
