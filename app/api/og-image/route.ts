import { NextRequest } from 'next/server'

const ALLOWED_HOSTS = new Set([
  'htcaeitweyjoajptofbb.supabase.co',
  'llpmmcampus.com',
  'www.llpmmcampus.com',
])

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src')

  if (!src) {
    return new Response('Missing src', { status: 400 })
  }

  let sourceUrl: URL
  try {
    sourceUrl = new URL(src)
  } catch {
    return new Response('Invalid src URL', { status: 400 })
  }

  if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
    return new Response('Unsupported protocol', { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(sourceUrl.hostname)) {
    return new Response('Host not allowed', { status: 400 })
  }

  const upstream = await fetch(sourceUrl.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; llpmm-og-proxy/1.0)',
    },
  })

  if (!upstream.ok) {
    return new Response('Upstream image not found', { status: 404 })
  }

  const contentType = upstream.headers.get('content-type') || 'image/png'
  const body = await upstream.arrayBuffer()

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}