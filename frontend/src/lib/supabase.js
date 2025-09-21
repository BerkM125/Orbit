import { createClient } from '@supabase/supabase-js'
import { browser } from '$app/environment'

// Direct access to environment variables that work with current Node version
const supabaseUrl = 'https://uwfnpwmchtnssaejiqep.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Zm5wd21jaHRuc3NhZWppcWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTU1ODUsImV4cCI6MjA3MzE5MTU4NX0.3Gc3tlFT3FS7K0QAK_Z03RLkteilqj6Mpu9l3Q2vJ4k'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: browser,
    persistSession: browser,
    detectSessionInUrl: browser
  }
})