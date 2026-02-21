'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{success: boolean; error?: string}>
  signOut: () => Promise<void>
}

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  phone?: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Check active session on mount with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout - setting loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching user profile for auth ID:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, phone')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      if (!data) {
        console.error('No user found in users table with ID:', userId)
        throw new Error('User profile not found')
      }
      
      console.log('User profile fetched successfully:', data)
      setUserProfile(data as UserProfile)
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error hint:', error?.hint)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        await fetchUserProfile(data.user.id)
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
