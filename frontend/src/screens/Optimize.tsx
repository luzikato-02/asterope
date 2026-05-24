import { useState } from 'react'
import { C } from '../tokens'
import { Panel, Kv } from '../components/shared'
import type { PlantData } from '../types'

export function Optimize({ data }: { data: PlantData }) {
  const { recommendations } = data
  const [applied, setApplied] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setApplied(prev => ({ ...prev, [id]: !prev[id] }))
  const appliedCount = Object.values(applied).filter(Boolean).length

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 280px', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="optimization queue · ranked by Δ kWh" right={`${recommendations.length} actions`}>
        <div style={{
          display: 'grid', gridTemplateColumns: '70px 80px 1fr 90px 70px 90px',
          padding: '6px 4px', borderBottom: `1px solid ${C.rule}`,
          fontSize: 10, color: C.ink3, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <span>id</span><span>type</span><span>action / scope</span>
          <span style={{ textAlign: 'right' }}>Δ kWh</span>
          <span style={{ textAlign: 'right' }}>conf</span><span />
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {recommendations.map(r => (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '70px 80px 1fr 90px 70px 90px',
              padding: '10px 4px', borderBottom: `1px solid ${C.ruleS}`,
              fontSize: 11.5, alignItems: 'center',
            }}>
              <span style={{ color: C.amber }}>{r.id}</span>
              <span style={{ color: C.ink2, fontSize: 10.5 }}>{r.category}</span>
              <div>
                <div style={{ color: C.ink }}>{r.title}</div>
                <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>{r.machine} · {r.horizon}</div>
              </div>
              <span style={{ textAlign: 'right', color: C.amber }}>−{r.savings_kwh}</span>
              <span style={{ textAlign: 'right', color: C.ink2 }}>{(r.confidence * 100).toFixed(0)}%</span>
              <button onClick={() => toggle(r.id)} style={{
                background: applied[r.id] ? C.amber : 'transparent',
                border: `1px solid ${C.amber}`,
                color: applied[r.id] ? C.bg : C.amber,
                fontFamily: C.mono, fontSize: 10, padding: '5px 10px',
                cursor: 'pointer', letterSpacing: 0.4,
              }}>
                {applied[r.id] ? '✓ APPLIED' : 'APPLY ⏎'}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Panel title="summary">
          <Kv k="actions_queued" v={recommendations.length} />
          <Kv k="actions_applied" v={appliedCount} />
          <div style={{ borderTop: `1px solid ${C.ruleS}`, marginTop: 6, paddingTop: 6 }}>
            <Kv k="potential_kwh_mo" v="13 408" vColor={C.amber} />
            <Kv k="potential_inr_mo" v="₹ 91 174" vColor={C.amber} />
            <Kv k="potential_co2_t" v="11.0 t" />
          </div>
        </Panel>

        <Panel title="action breakdown">
          {['speed', 'schedule', 'idle', 'cluster'].map(cat => {
            const items = recommendations.filter(r => r.category === cat)
            const sum = items.reduce((s, r) => s + r.savings_kwh, 0)
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>{cat}</span><span style={{ color: C.amber }}>−{sum} kWh/d</span>
                </div>
                <div style={{ height: 4, background: C.ruleS, marginTop: 3 }}>
                  <div style={{ height: '100%', background: C.amber, width: `${Math.min(sum / 700, 1) * 100}%`, opacity: 0.7 }} />
                </div>
              </div>
            )
          })}
        </Panel>

        <Panel title="constraints active">
          <div style={{ fontSize: 10.5, color: C.ink2, lineHeight: 1.7 }}>
            <div>tpi_tolerance ≤ 3%</div>
            <div>rpm ∈ [7200, 12600]</div>
            <div>doff_stagger ≥ 12 min</div>
            <div>off_peak: 22:00–06:00</div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
