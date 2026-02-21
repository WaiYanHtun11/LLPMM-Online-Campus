import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ImageResponse } from 'next/og'
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'

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

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params
    const previewMode = req.nextUrl.searchParams.get('preview') === '1'

    const { data: refreshed, error: refreshError } = await supabaseAdmin
      .rpc('refresh_enrollment_certificate_status', { p_enrollment_id: enrollmentId })

    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 500 })
    }

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id, certificate, certificate_url, certificate_issued_at, users!inner(name), batches!inner(id, batch_name, instructor_id, courses!inner(title))')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (!refreshed || !enrollment.certificate) {
      return NextResponse.json({ error: 'Certificate not available yet' }, { status: 400 })
    }

    if (enrollment.certificate_url && !previewMode) {
      const upstream = await fetch(enrollment.certificate_url)
      if (!upstream.ok) {
        return NextResponse.json({ error: 'Failed to fetch uploaded certificate' }, { status: 502 })
      }

      const buffer = await upstream.arrayBuffer()
      const urlPath = new URL(enrollment.certificate_url).pathname
      const ext = urlPath.split('.').pop()?.toLowerCase()

      let contentType = upstream.headers.get('content-type') || 'application/octet-stream'
      if (!contentType || contentType === 'application/octet-stream') {
        if (ext === 'pdf') contentType = 'application/pdf'
        else if (ext === 'png') contentType = 'image/png'
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
      }

      const filename = `certificate-${enrollmentId}.${ext || 'bin'}`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const userRow: any = pickOne(enrollment.users as any)
    const batchRow: any = pickOne(enrollment.batches as any)
    const courseRow: any = pickOne(batchRow?.courses)

    let instructorName = 'Instructor'
    if (batchRow?.instructor_id) {
      const { data: instructorData } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', batchRow.instructor_id)
        .single()

      if (instructorData?.name) {
        instructorName = instructorData.name
      }
    }

    const instructorFirstName = instructorName.trim().split(/\s+/)[0] || 'Instructor'

    const studentName = escapeHtml(userRow?.name || 'Student')
    const courseTitle = escapeHtml(courseRow?.title || 'Course')
    const instructorFirstNameEscaped = escapeHtml(instructorFirstName)
    const instructorNameEscaped = escapeHtml(instructorName)

    const issueDateShort = new Date(enrollment.certificate_issued_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const templatePath = path.join(process.cwd(), 'public', 'certificate-template.png')
    const templateBuffer = await fs.readFile(templatePath)
    const templateDataUrl = `data:image/png;base64,${templateBuffer.toString('base64')}`

    const greatVibesFontPath = path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf')
    const greatVibesFontBuffer = await fs.readFile(greatVibesFontPath)

    const momoSignatureFontPath = path.join(process.cwd(), 'public', 'fonts', 'MomoSignature-Regular.ttf')
    const momoSignatureFontBuffer = await fs.readFile(momoSignatureFontPath)

    const montserratRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf')
    const montserratRegularBuffer = await fs.readFile(montserratRegularPath)

    const montserratBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf')
    const montserratBoldBuffer = await fs.readFile(montserratBoldPath)

    const montserratExtraBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-ExtraBold.ttf')
    const montserratExtraBoldBuffer = await fs.readFile(montserratExtraBoldPath)

    const textBlockTop = 570
    const textBlockWidth = 2000

    const studentNameLength = studentName.replace(/\s+/g, ' ').trim().length
    const studentNameFontSize = studentNameLength > 28 ? 70 : studentNameLength > 22 ? 80 : 90

    const descriptionFontSize = courseTitle.length > 28 ? 24 : 40
    const descriptionGap = courseTitle.length > 28 ? 14 : 18
    const descriptionLineHeight = 1.18

    const certificateElement = React.createElement(
      'div',
      {
        style: {
          width: '2000px',
          height: '1414px',
          position: 'relative',
          display: 'flex',
          backgroundImage: `url(${templateDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          fontFamily: 'Montserrat, Arial, sans-serif',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${textBlockTop}px`,
            width: `${textBlockWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#0f172a',
          },
        },
        React.createElement(
          'div',
          {
            style: {
                marginTop: 50,
              fontSize: studentNameFontSize,
              fontFamily: 'Great Vibes',
              fontWeight: 700,
              lineHeight: 1.05,
              color: '#263957',
              textAlign: 'center',
            },
          },
          studentName
        ),
        React.createElement(
          'div',
          {
            style: {
              marginTop: 90,
              fontSize: descriptionFontSize,
              fontFamily: 'Montserrat',
              fontWeight: 750,
              lineHeight: descriptionLineHeight,
              textAlign: 'center',
            },
          },
          `has successfully completed the "${courseTitle}" Course`
        ),
        React.createElement(
          'div',
          {
            style: {
              marginTop: descriptionGap,
              fontSize: descriptionFontSize,
              fontFamily: 'Montserrat',
              fontWeight: 750,
              lineHeight: descriptionLineHeight,
              textAlign: 'center',
            },
          },
          `on "${issueDateShort}" and`
        ),
        React.createElement(
          'div',
          {
            style: {
              marginTop: descriptionGap,
              fontSize: descriptionFontSize,
              fontFamily: 'Montserrat',
              fontWeight: 750,
              lineHeight: descriptionLineHeight,
              textAlign: 'center',
            },
          },
          'has mastered the core curriculum of the program.'
        )
      ),
      React.createElement('div', {
        style: {
          position: 'absolute',
          left: '380px',
          bottom: '290x',
          fontSize: 52,
          color: '#0f172a',
          fontFamily: 'Momo Signature',
          fontWeight: 400,
          transform: 'rotate(-10deg)',
          textDecoration: 'underline',
        },
      }, instructorFirstNameEscaped),
      React.createElement('div', {
        style: {
          position: 'absolute',
          left: '300px',
          bottom: '190px',
          fontSize: 38,
          color: '#263957',
          fontFamily: 'Montserrat',
          fontWeight: 800,
        },
      }, instructorNameEscaped),
      React.createElement('div', {
        style: {
          position: 'absolute',
          left: '50%',
          bottom: '22px',
          transform: 'translateX(-50%)',
          fontSize: 24,
          color: '#334155',
          fontFamily: 'Montserrat',
          fontWeight: 700,
          background: 'rgba(255,255,255,0.65)',
          padding: '6px 12px',
          borderRadius: '8px',
        },
      }, `ID: ${escapeHtml(enrollment.id)}`)
    )

    const image = new ImageResponse(certificateElement, {
      width: 2000,
      height: 1414,
      fonts: [
        {
          name: 'Great Vibes',
          data: greatVibesFontBuffer,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Momo Signature',
          data: momoSignatureFontBuffer,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Montserrat',
          data: montserratRegularBuffer,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Montserrat',
          data: montserratBoldBuffer,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Montserrat',
          data: montserratExtraBoldBuffer,
          style: 'normal',
          weight: 800,
        },
      ],
    })

    const pngBuffer = await image.arrayBuffer()

    if (previewMode) {
      return new NextResponse(pngBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="certificate-preview-${enrollmentId}.png"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const pdfDoc = await PDFDocument.create()
    const pngImage = await pdfDoc.embedPng(pngBuffer)
    const { width, height } = pngImage.scale(1)
    const page = pdfDoc.addPage([width, height])
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
    })

    const pdfBytes = await pdfDoc.save()
    const pdfArrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer

    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${enrollmentId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate certificate' }, { status: 500 })
  }
}
