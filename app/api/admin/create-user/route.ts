import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client with service role key (server-side only!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role, phone, instructorData } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Step 1: Create auth user using admin API (bypasses rate limits)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Step 2: Create user in public.users table
    const userData: any = {
      id: authData.user.id,
      email,
      name,
      role,
      phone: phone || null
    }

    // Add instructor payment fields if role is instructor
    if (role === 'instructor' && instructorData) {
      userData.payment_method = instructorData.payment_method || null
      userData.payment_account_name = instructorData.payment_account_name || null
      userData.payment_account_number = instructorData.payment_account_number || null
      userData.payment_model = instructorData.payment_model || null
      userData.profit_share_percentage = instructorData.payment_model === 'profit_share' 
        ? parseFloat(instructorData.profit_share_percentage) || null 
        : null
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([userData])

    if (dbError) {
      console.error('Database error:', dbError)
      // If database insert fails, delete the auth user to keep consistency
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role
      }
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
