import { FormEvent, useEffect, useState } from 'react'
import { C } from '../tokens'
import { useAuth } from './AuthContext'
import { apiGetTotpSetup, apiConfirmTotpSetup } from './authApi'

export function TotpSetupPage() {
  const { partialToken, onTotpDone, logout } = useAuth()

  const [qrB64,   setQrB64]   = useState<string | null>(null)
  const [secret,  setSecret]  = useState('')
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!partialToken) return
    apiGetTotpSetup(partialToken)
      .then(d => { setQrB64(d.qr_base64); setSecret(d.secret) })
      .catch(() => setError('failed to load QR code — try logging in again'))
  }, [partialToken])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!partialToken || code.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const res = await apiConfirmTotpSetup(code, partialToken)
      onTotpDone(res.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'verification failed')
      setCode('')
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
        width: 400, padding: '40px 36px',
        border: `1px solid ${C.rule}`, background: C.panel,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: C.amber, letterSpacing: 2, marginBottom: 6 }}>
            ◆ ASTEROPE
          </div>
          <div style={{ fontSize: 11, color: C.ink2 }}>set up two-factor authentication</div>
          <div style={{ fontSize: 10, color: C.ink3, marginTop: 4 }}>
            scan the QR code with Google Authenticator, then enter the 6-digit code to verify
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: '#ffffff', padding: 16, marginBottom: 20,
          minHeight: 180,
        }}>
          {qrB64
            ? <img src={`data:image/svg+xml;base64,${qrB64}`} alt="Google Authenticator QR code" style={{ width: 148, height: 148 }} />
            : <div style={{ color: '#888', fontSize: 11, fontFamily: C.mono }}>
                {error ? 'error loading QR' : 'loading QR…'}
              </div>
          }
        </div>

        {/* Manual entry secret */}
        {secret && (
          <div style={{ marginBottom: 22, padding: '10px 12px', background: C.bg, border: `1px solid ${C.ruleS}` }}>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              manual entry key
            </div>
            <div style={{
              fontSize: 13, color: C.amber, letterSpacing: 3,
              wordBreak: 'break-all', lineHeight: 1.8,
            }}>
              {secret.match(/.{1,4}/g)?.join(' ')}
            </div>
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              verification code
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              style={{
                width: '100%', background: C.bg, border: 'none',
                borderBottom: `1px solid ${C.ink4}`,
                color: C.amber, fontFamily: C.mono, fontSize: 22,
                padding: '8px 0', outline: 'none', letterSpacing: 6, textAlign: 'center',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 11, color: C.warn, padding: '6px 10px', border: `1px solid ${C.warn}`, background: 'rgba(196,90,58,0.08)' }}>
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !qrB64}
            style={{
              background:  loading ? 'transparent' : C.amber,
              border:      `1px solid ${C.amber}`,
              color:       loading ? C.amber : C.bg,
              fontFamily:  C.mono, fontSize: 11,
              padding:     '10px 0', letterSpacing: 1,
              cursor:      loading ? 'wait' : 'pointer',
              opacity:     code.length !== 6 || !qrB64 ? 0.4 : 1,
            }}
          >
            {loading ? 'verifying…' : 'ENABLE 2FA →'}
          </button>
        </form>

        <button
          onClick={logout}
          style={{ marginTop: 16, background: 'transparent', border: 'none', color: C.ink3, fontFamily: C.mono, fontSize: 10, cursor: 'pointer', padding: 0 }}
        >
          ← back to login
        </button>
      </div>
    </div>
  )
}
