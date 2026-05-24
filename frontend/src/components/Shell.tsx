import { ReactNode, useEffect, useState } from 'react'
import { C } from '../tokens'

export const SCREENS = [
  { id: 'dash',    label: 'monitor',     k: 'F1' },
  { id: 'predict', label: 'predict',     k: 'F2' },
  { id: 'reco',    label: 'optimize',    k: 'F3' },
  { id: 'anom',    label: 'anomalies',   k: 'F4' },
  { id: 'hist',    label: 'history',     k: 'F5' },
  { id: 'drill',   label: 'machines',    k: 'F6' },
  { id: 'train',   label: 'model',       k: 'F7' },
  { id: 'ingest',  label: 'ingest · db', k: 'F8' },
  { id: 'set',     label: 'settings',    k: 'F9' },
] as const

export type ScreenId = typeof SCREENS[number]['id']

interface Props {
  active: ScreenId
  setActive: (id: ScreenId) => void
  children: ReactNode
}

export function Shell({ active, setActive, children }: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const fmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{
      width: 1440, height: 900, background: C.bg, color: C.ink, fontFamily: C.mono,
      fontSize: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.rule}`,
        padding: '0 16px', height: 36, gap: 18, background: C.panel,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.amber, letterSpacing: 1 }}>◆ ASTEROPE</span>
          <span style={{ fontSize: 10, color: C.ink3 }}>energy-opt v2.6.1 // gomati-mill // shift-2</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10.5, color: C.ink2, display: 'flex', gap: 18 }}>
          <span><span style={{ color: C.ok }}>●</span> shift B · 14:00–22:00</span>
          <span><span style={{ color: C.ok }}>●</span> model:v2026.05.21-3</span>
          <span><span style={{ color: C.ok }}>●</span> plc:live</span>
          <span><span style={{ color: C.amber }}>●</span> xlsx:enabled</span>
          <span><span style={{ color: C.ok }}>●</span> db:local</span>
          <span>2026-05-24 {fmt} IST</span>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.rule}`, background: C.panel, height: 34 }}>
        {SCREENS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            border: 0, background: active === s.id ? C.bg : 'transparent',
            borderRight: `1px solid ${C.rule}`,
            borderTop: active === s.id ? `1px solid ${C.amber}` : '1px solid transparent',
            borderBottom: 'none',
            color: active === s.id ? C.ink : C.ink2,
            padding: '0 16px', fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: active === s.id ? -1 : 0,
          }}>
            <span style={{ color: C.ink3 }}>{s.k}</span>
            <span>{s.label}</span>
          </button>
        ))}
        <div style={{ flex: 1, borderBottom: `1px solid ${C.rule}` }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>

      {/* Status bar */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${C.rule}`, padding: '0 16px', height: 22,
        alignItems: 'center', background: C.panel, fontSize: 10, color: C.ink3, gap: 24,
      }}>
        <span>cpu 21%</span>
        <span>mem 4.1G / 8G</span>
        <span>plc.runtime: 182 401 rows/24h</span>
        <span>plc.energy: 182 401 rows/24h</span>
        <span>lag 240ms</span>
        <span style={{ marginLeft: 'auto', color: C.ink2 }}>↑/↓ navigate · ⏎ open · q quit</span>
      </div>
    </div>
  )
}
