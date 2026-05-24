import { FormEvent, useState } from 'react'
import { C } from '../tokens'
import { useAuth } from './AuthContext'
import { apiLogin } from './authApi'

const field: React.CSSProperties = {
  width: '100%',
  background: C.bg,
  border: 'none',
  borderBottom: `1px solid ${C.ink4}`,
  color: C.ink,
  fontFamily: C.mono,
  fontSize: 12,
  padding: '8px 0',
  outline: 'none',
}

export function LoginPage() {
  const { onLoginSuccess } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin(username.trim(), password)
      onLoginSuccess(res.step, res.token, username.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: C.mono,
    }}>
      <div style={{
        width: 360, padding: '40px 36px',
        border: `1px solid ${C.rule}`, background: C.panel,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: C.amber, letterSpacing: 2, marginBottom: 6 }}>
            ◆ ASTEROPE
          </div>
          <div style={{ fontSize: 10, color: C.ink3 }}>
            energy-opt v2.6.1 // gomati-mill
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Username */}
          <div>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              username
            </div>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              spellCheck={false}
              style={field}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              password
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={field}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 11, color: C.warn, padding: '6px 10px', border: `1px solid ${C.warn}`, background: 'rgba(196,90,58,0.08)' }}>
              ✗ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              marginTop: 4,
              background:  loading ? 'transparent' : C.amber,
              border:      `1px solid ${C.amber}`,
              color:       loading ? C.amber : C.bg,
              fontFamily:  C.mono,
              fontSize:    11,
              padding:     '10px 0',
              letterSpacing: 1,
              cursor:      loading ? 'wait' : 'pointer',
              opacity:     (!username || !password) ? 0.4 : 1,
            }}
          >
            {loading ? 'authenticating…' : 'LOGIN →'}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${C.ruleS}`, fontSize: 10, color: C.ink3, lineHeight: 1.7 }}>
          demo · <span style={{ color: C.ink2 }}>admin</span> / <span style={{ color: C.ink2 }}>asterope2026</span>
        </div>
      </div>
    </div>
  )
}
