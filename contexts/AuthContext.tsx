import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, AuthUser, AuthState } from '../services/supabaseService'
import { User } from '@supabase/supabase-js'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // 检查初始的认证状态
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              user_metadata: session.user.user_metadata
            },
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('检查认证状态时出错:', error)
        setAuthState({
          user: null,
          loading: false,
          error: '检查认证状态失败'
        })
      }
    }

    checkAuth()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('认证状态变化:', event, session)

        if (session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              user_metadata: session.user.user_metadata
            },
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: true }
    } catch (error) {
      const errorMessage = '登录失败，请稍后重试'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: true }
    } catch (error) {
      const errorMessage = '注册失败，请稍后重试'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      await supabase.auth.signOut()
      setAuthState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('登出失败:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: '登出失败'
      }))
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '重置密码失败，请稍后重试' }
    }
  }

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}