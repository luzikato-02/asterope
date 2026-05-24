import { CSSProperties, ReactNode } from 'react'
import { C } from '../tokens'

// ── Panel ─────────────────────────────────────────────────────────────────────

interface PanelProps {
  title: string
  right?: ReactNode
  children: ReactNode
  style?: CSSProperties
  pad?: number
}

export function Panel({ title, right, children, style, pad = 14 }: PanelProps) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.rule}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: `1px solid ${C.rule}`,
        fontSize: 10, color: C.ink3, letterSpacing: 0.6, textTransform: 'uppercase',
        background: C.panel2,
      }}>
        <span>{title}</span>
        <span style={{ color: C.ink2, textTransform: 'none', letterSpacing: 0 }}>{right}</span>
      </div>
      <div style={{ padding: pad, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

// ── Kv ───────────────────────────────────────────────────────────────────────

export function Kv({ k, v, vColor }: { k: string; v: ReactNode; vColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11.5 }}>
      <span style={{ color: C.ink3 }}>{k}</span>
      <span style={{ color: vColor ?? C.ink }}>{v}</span>
    </div>
  )
}

// ── Big ───────────────────────────────────────────────────────────────────────

export function Big({ v, u, c }: { v: ReactNode; u?: string; c?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 28, color: c ?? C.ink, letterSpacing: -0.5 }}>{v}</span>
      {u && <span style={{ fontSize: 11, color: C.ink3 }}>{u}</span>}
    </div>
  )
}

// ── Knob (range slider) ───────────────────────────────────────────────────────

interface KnobProps {
  label: string
  val: number
  set: (v: number) => void
  min: number
  max: number
  step: number
  u: string
}

export function Knob({ label, val, set, min, max, step, u }: KnobProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.ink3 }}>
        <span>{label}</span>
        <span style={{ color: C.amber }}>{val}{u}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ width: '100%', appearance: 'none', height: 2, background: C.ruleS, accentColor: C.amber, marginTop: 4 }} />
    </div>
  )
}
