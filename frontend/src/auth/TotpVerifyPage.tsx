import { FormEvent, useEffect, useState } from 'react'
import { C } from '../tokens'
import { useAuth } from './AuthContext'
import { apiVerifyTotp } from './authApi'

export function TotpVerifyPage() {
  const { partialToken, onTotpDone, logout } = useAuth()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 30-second TOTP countdown
  const [secondsLeft, setSecondsLeft] = useState(() => 30 - (Math.floor(Date.now() / 1000) % 30))

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(30 - (Math.floor(Date.now() / 1000) % 30)), 500)
    return () => clearInterval(t)
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!partialToken || code.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const res = await apiVerifyTotp(code, partialToken)
      onTotpDone(res.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'verification failed')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const urgentColor = secondsLeft <= 5 ? C.warn : secondsLeft <= 10 ? C.amber : C.ok

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
          <div style={{ fontSize: 11, color: C.ink2 }}>two-factor authentication</div>
          <div style={{ fontSize: 10, color: C.ink3, marginTop: 4 }}>
            open Google Authenticator and enter the 6-digit code
          </div>
        </div>

        {/* Timer ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke={C.ruleS} strokeWidth={4} />
              <circle cx={32} cy={32} r={26} fill="none" stroke={urgentColor} strokeWidth={4}
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - secondsLeft / 30)}`}
                style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: urgentColor, fontVariantNumeric: 'tabular-nums',
            }}>
              {secondsLeft}
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              style={{
                width: '100%', background: C.bg, border: 'none',
                borderBottom: `1px solid ${C.ink4}`,
                color: C.amber, fontFamily: C.mono, fontSize: 28,
                padding: '10px 0', outline: 'none', letterSpacing: 8, textAlign: 'center',
              }}
            />
            <div style={{ fontSize: 10, color: C.ink3, textAlign: 'center', marginTop: 6 }}>
              code expires in {secondsLeft}s
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 11, color: C.warn, padding: '6px 10px', border: `1px solid ${C.warn}`, background: 'rgba(196,90,58,0.08)' }}>
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              background:  loading ? 'transparent' : C.amber,
              border:      `1px solid ${C.amber}`,
              color:       loading ? C.amber : C.bg,
              fontFamily:  C.mono, fontSize: 11,
              padding:     '10px 0', letterSpacing: 1,
              cursor:      loading ? 'wait' : 'pointer',
              opacity:     code.length !== 6 ? 0.4 : 1,
            }}
          >
            {loading ? 'verifying…' : 'VERIFY →'}
          </button>
        </form>

        <button
          onClick={logout}
          style={{ marginTop: 20, background: 'transparent', border: 'none', color: C.ink3, fontFamily: C.mono, fontSize: 10, cursor: 'pointer', padding: 0 }}
        >
          ← back to login
        </button>
      </div>
    </div>
  )
}
