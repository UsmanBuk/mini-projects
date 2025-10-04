import { createClient, Session, User } from '@supabase/supabase-js'
import Store from 'electron-store'

interface AuthStore {
  session: Session | null
  user: User | null
}

const store = new Store<AuthStore>()

export class AuthManager {
  private supabase
  private currentSession: Session | null = null

  constructor() {
    // Use environment variables for Supabase config
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Check .env file.')
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // We'll handle persistence manually
      }
    })

    // Restore session from store
    this.restoreSession()
  }

  private async restoreSession() {
    const storedSession = store.get('session')
    if (storedSession) {
      try {
        const { data, error } = await this.supabase.auth.setSession(storedSession)
        if (error) throw error
        this.currentSession = data.session
      } catch (error) {
        console.error('Failed to restore session:', error)
        this.clearSession()
      }
    }
  }

  private saveSession(session: Session | null) {
    if (session) {
      store.set('session', session)
      store.set('user', session.user)
    } else {
      store.delete('session')
      store.delete('user')
    }
    this.currentSession = session
  }

  private clearSession() {
    store.delete('session')
    store.delete('user')
    this.currentSession = null
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      this.saveSession(data.session)
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      // For email confirmation flow, we might not get a session immediately
      if (data.session) {
        this.saveSession(data.session)
      }

      return { success: true }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      this.clearSession()
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) return false

      const { data, error } = await this.supabase.auth.refreshSession()
      if (error) throw error

      this.saveSession(data.session)
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      this.clearSession()
      return false
    }
  }

  getSession(): Session | null {
    return this.currentSession
  }

  getUser(): User | null {
    return this.currentSession?.user || null
  }

  isAuthenticated(): boolean {
    return !!this.currentSession?.user
  }

  getSupabaseClient() {
    return this.supabase
  }

  // Set up auth state change listener
  onAuthStateChange(callback: (session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      this.saveSession(session)
      callback(session)
    })
  }
}