// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Custom storage adapter for Capacitor
const createCapacitorStorage = () => {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    // Use localStorage for web
    return window?.localStorage
  }

  // For Capacitor/Android, use a custom storage that ensures persistence
  return {
    getItem: async (key: string) => {
      try {
        const value = localStorage.getItem(key)
        console.log('📦 Storage GET:', key, value ? 'found' : 'not found')
        return value
      } catch (error) {
        console.error('Storage getItem error:', error)
        return null
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        localStorage.setItem(key, value)
        console.log('📦 Storage SET:', key, 'saved')
      } catch (error) {
        console.error('Storage setItem error:', error)
      }
    },
    removeItem: async (key: string) => {
      try {
        localStorage.removeItem(key)
        console.log('📦 Storage REMOVE:', key)
      } catch (error) {
        console.error('Storage removeItem error:', error)
      }
    }
  }
}

export const createClient = () => {
  const storage = createCapacitorStorage()

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: storage as any,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce', // Use PKCE flow for better security
    }
  })
}

// Export a singleton instance for reuse
let clientInstance: SupabaseClient<Database> | null = null

export const getClient = () => {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}