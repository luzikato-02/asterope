import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type AuthStep = 'login' | 'totp-verify' | 'totp-setup' | 'done'

interface AuthState {
  step:         AuthStep
  partialToken: string | null
  fullToken:    string | null
  username:     string | null
}

interface AuthContextType extends AuthState {
  onLoginSuccess:      (step: 'totp-verify' | 'totp-setup', token: string, username: string) => void
  onTotpDone:          (fullToken: string) => void
  logout:              () => void
}

const TOKEN_KEY = 'asterope_token'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    return stored
      ? { step: 'done', fullToken: stored, partialToken: null, username: null }
      : { step: 'login', fullToken: null, partialToken: null, username: null }
  })

  function onLoginSuccess(step: 'totp-verify' | 'totp-setup', token: string, username: string) {
    setState({ step, partialToken: token, fullToken: null, username })
  }

  function onTotpDone(fullToken: string) {
    localStorage.setItem(TOKEN_KEY, fullToken)
    setState(s => ({ ...s, step: 'done', fullToken, partialToken: null }))
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setState({ step: 'login', fullToken: null, partialToken: null, username: null })
  }

  // Clear stored token and return to login on any 401 from the data API
  useEffect(() => {
    function handle() { logout() }
    window.addEventListener('auth:unauthorized', handle)
    return () => window.removeEventListener('auth:unauthorized', handle)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, onLoginSuccess, onTotpDone, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
