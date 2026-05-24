import { useMemo, useState } from 'react'
import { C } from '../tokens'
import { Panel, Kv } from '../components/shared'
import { LineChart } from '../components/charts/LineChart'
import { fetchMachineSeries } from '../api'
import type { Anomaly, MachinePoint, PlantData } from '../types'
import { useEffect } from 'react'

export function Anomalies({ data }: { data: PlantData }) {
  const { anomalies, history } = data
  const [sel, setSel] = useState<Anomaly>(anomalies[0])
  const [series, setSeries] = useState<MachinePoint[]>([])

  useEffect(() => {
    const seed = sel.id.charCodeAt(2)
    fetchMachineSeries(seed).then(setSeries)
  }, [sel.id])

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="alerts · today" right={`${anomalies.length} total`}>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 50px 80px 50px 1fr 70px',
          fontSize: 10, color: C.ink3, padding: '4px 0', borderBottom: `1px solid ${C.rule}`, textTransform: 'uppercase',
        }}>
          <span>id</span><span>time</span><span>machine</span><span>sev</span><span>kind</span><span>status</span>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {anomalies.map(a => (
            <button key={a.id} onClick={() => setSel(a)} style={{
              display: 'grid', gridTemplateColumns: '60px 50px 80px 50px 1fr 70px',
              width: '100%', textAlign: 'left', border: 0,
              background: sel.id === a.id ? C.panel2 : 'transparent',
              padding: '7px 0', borderBottom: `1px solid ${C.ruleS}`,
              color: C.ink, fontFamily: C.mono, fontSize: 11, cursor: 'pointer', alignItems: 'center',
            }}>
              <span style={{ color: C.ink3 }}>{a.id}</span>
              <span style={{ color: C.ink3 }}>{a.time}</span>
              <span>{a.machine}</span>
              <span style={{ color: a.severity === 'high' ? C.warn : a.severity === 'med' ? C.amber : C.ink3 }}>
                [{a.severity}]
              </span>
              <span style={{ color: C.ink2 }}>{a.kind}</span>
              <span style={{ color: a.status === 'open' ? C.warn : a.status === 'ack' ? C.amber : C.ok, fontSize: 10 }}>
                {a.status}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Panel title={`inspect · ${sel.id}`} right={sel.machine}>
          <div style={{ fontSize: 14, color: C.ink, marginBottom: 6 }}>{sel.kind}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Kv k="severity"  v={sel.severity.toUpperCase()} vColor={sel.severity === 'high' ? C.warn : C.amber} />
            <Kv k="z-score"   v="4.21σ" vColor={C.warn} />
            <Kv k="detected"  v={sel.time} />
            <Kv k="status"    v={sel.status.toUpperCase()} vColor={sel.status === 'open' ? C.warn : C.ok} />
            <Kv k="baseline"  v="9.2 kW" />
            <Kv k="observed"  v="11.8 kW" vColor={C.warn} />
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: C.ink3 }}>kw · 24h trace</div>
          {series.length > 0 && (
            <LineChart w={580} h={140} data={series as unknown as Record<string, number>[]} xKey="t"
              yKeys={[{ key: 'kw', stroke: C.amber, strokeWidth: 1.2, fill: 'rgba(201,138,58,0.07)' }]}
              pad={{ t: 6, r: 10, b: 18, l: 36 }} />
          )}
          <div style={{
            marginTop: 8, padding: '8px 10px', background: C.bg,
            border: `1px solid ${C.ruleS}`, fontSize: 11, color: C.ink2, lineHeight: 1.6,
          }}>
            <span style={{ color: C.amber, fontSize: 10 }}>// model says</span><br />
            Power draw exceeded predicted band by 4.21σ for 18 min starting 14:14.<br />
            Pattern matches bearing-wear signature from 6 prior incidents (Apr–May).<br />
            recommend: inspection at next doff
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button style={{ flex: 1, background: C.amber, border: 0, color: C.bg, padding: '8px 10px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer', letterSpacing: 0.4 }}>ACK ⌘A</button>
            <button style={{ flex: 1, background: 'transparent', border: `1px solid ${C.amber}`, color: C.amber, padding: '8px 10px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer' }}>OPEN WO ⌘W</button>
            <button style={{ flex: 1, background: 'transparent', border: `1px solid ${C.ink3}`, color: C.ink2, padding: '8px 10px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer' }}>SILENCE 1h</button>
          </div>
        </Panel>

        <Panel title="anomaly density · 14d">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 40 }}>
            {history.map((d, i) => (
              <div key={i} style={{ flex: 1, height: `${(d.anomalies / 6) * 100}%`, background: C.amber, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.ink3, marginTop: 4 }}>
            <span>{history[0].label}</span>
            <span>{history[history.length - 1].label}</span>
          </div>
        </Panel>
      </div>
    </div>
  )
}
