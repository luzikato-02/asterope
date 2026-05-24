import { useEffect, useRef, useState } from 'react'
import { Shell, type ScreenId } from './components/Shell'
import { Dashboard }  from './screens/Dashboard'
import { Predict }    from './screens/Predict'
import { Optimize }   from './screens/Optimize'
import { Anomalies }  from './screens/Anomalies'
import { History }    from './screens/History'
import { Machines }   from './screens/Machines'
import { Model }      from './screens/Model'
import { Ingest }     from './screens/Ingest'
import { Settings }   from './screens/Settings'
import { LoginPage }     from './auth/LoginPage'
import { TotpVerifyPage }from './auth/TotpVerifyPage'
import { TotpSetupPage } from './auth/TotpSetupPage'
import { useAuth }    from './auth/AuthContext'
import { fetchAll }   from './api'
import type { PlantData } from './types'
import { C } from './tokens'

const SCALE_WRAP_ID = 'scale-wrap'

function fit() {
  const wrap = document.getElementById(SCALE_WRAP_ID)
  if (!wrap) return
  const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900, 1.4)
  wrap.style.transform = `scale(${s})`
}

function Dashboard_({ data, logout }: { data: PlantData; logout: () => void }) {
  const [active, setActive] = useState<ScreenId>('dash')

  const Screen = {
    dash:    <Dashboard data={data} />,
    predict: <Predict   data={data} />,
    reco:    <Optimize  data={data} />,
    anom:    <Anomalies data={data} />,
    hist:    <History   data={data} />,
    drill:   <Machines  data={data} />,
    train:   <Model     data={data} />,
    ingest:  <Ingest    data={data} />,
    set:     <Settings  onLogout={logout} />,
  }[active]

  return (
    <div id={SCALE_WRAP_ID} style={{ width: 1440, height: 900, transformOrigin: 'center center', flex: '0 0 auto' }}>
      <Shell active={active} setActive={setActive}>
        {Screen}
      </Shell>
    </div>
  )
}

function AuthenticatedApp({ logout }: { logout: () => void }) {
  const [data,  setData]  = useState<PlantData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll().then(setData).catch(e => setError(String(e)))
  }, [])

  useEffect(() => {
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  if (error) {
    return (
      <div style={{ color: C.warn, fontFamily: C.mono, padding: 40, fontSize: 13 }}>
        <div style={{ color: C.amber, marginBottom: 8 }}>◆ ASTEROPE · backend unreachable</div>
        <div>{error}</div>
        <div style={{ color: C.ink3, marginTop: 12, fontSize: 11 }}>
          Start the Flask backend: cd backend && python main.py
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ color: C.ink3, fontFamily: C.mono, padding: 40, fontSize: 12 }}>
        <span style={{ color: C.amber }}>◆ ASTEROPE</span> · loading…
      </div>
    )
  }

  return <Dashboard_ data={data} logout={logout} />
}

export function App() {
  const { step, logout } = useAuth()

  if (step === 'login')       return <LoginPage />
  if (step === 'totp-setup')  return <TotpSetupPage />
  if (step === 'totp-verify') return <TotpVerifyPage />

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AuthenticatedApp logout={logout} />
    </div>
  )
}
