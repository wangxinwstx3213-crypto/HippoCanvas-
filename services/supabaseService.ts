import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Please check your environment variables.')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'exists' : 'missing')
  console.log('Environment variables check:')
  console.log('import.meta.env.NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('process.env.NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 认证相关的类型定义
export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}