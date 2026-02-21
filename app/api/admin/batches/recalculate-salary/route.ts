import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recalculateInstructorSalary } from '@/lib/server/recalculate-instructor-salary'

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
    const body = await req.json()
    const batchId = body?.batchId

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
    }

    const result = await recalculateInstructorSalary(supabaseAdmin, batchId)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate instructor salary' },
      { status: 500 }
    )
  }
}
