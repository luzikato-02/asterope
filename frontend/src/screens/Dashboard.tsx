import { C } from '../tokens'
import { Panel, Big } from '../components/shared'
import { LineChart } from '../components/charts/LineChart'
import type { PlantData } from '../types'

export function Dashboard({ data }: { data: PlantData }) {
  const { machines, plantSeries, anomalies, recommendations } = data
  const series = plantSeries
  const i = 58
  const current = series[i].actual
  const predicted = series[i].predicted
  const dt = current - predicted

  const running = machines.filter(m => m.status === 'running')
  const openAlerts = anomalies.filter(a => a.status === 'open')

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridTemplateRows: 'auto 1fr auto', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="01 / live load" right="kW · live">
        <Big v={current.toLocaleString()} u="kW" c={dt > 0 ? C.warn : C.ok} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          pred {predicted.toLocaleString()} · Δ {dt > 0 ? '+' : ''}{dt.toFixed(0)}kW ({((dt / predicted) * 100).toFixed(1)}%)
        </div>
      </Panel>

      <Panel title="02 / current shift · B" right="14:00 → 22:00">
        <Big
          v={(series.slice(56, i).reduce((s, p) => s + p.actual / 4, 0) / 1000).toFixed(2)}
          u={`MWh · ${((i - 56) / 4).toFixed(1)}h / 8h`}
        />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          shift fcst 21.8 MWh · target 21.4 · source: plc-live
        </div>
      </Panel>

      <Panel title="03 / fleet">
        <Big v={running.length} u={`/ ${machines.length}`} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          {machines.filter(m => m.status === 'doff').length} doff ·{' '}
          {machines.filter(m => m.status === 'idle').length} idle ·{' '}
          {machines.filter(m => m.status === 'fault').length} fault
        </div>
      </Panel>

      <Panel title="04 / alerts">
        <Big v={openAlerts.length} u="open" c={C.warn} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          {anomalies.filter(a => a.status === 'ack').length} ack ·{' '}
          {anomalies.filter(a => a.status === 'resolved').length} resolved
        </div>
      </Panel>

      <Panel title="plant load · pred vs actual · 24h" right="MAPE 3.41%" style={{ gridColumn: 'span 3' }}>
        <div style={{ flex: 1 }}>
          <LineChart w={1010} h={360} data={series as unknown as Record<string, number>[]} xKey="t" yKeys={[
            { key: 'predicted', stroke: C.ink3, strokeWidth: 1, dash: '2 3' },
            { key: 'actual',    stroke: C.amber, strokeWidth: 1.4, fill: 'rgba(201,138,58,0.07)' },
          ]} />
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          <span>━━ actual</span><span>· · · predicted</span>
          <span style={{ marginLeft: 'auto', color: C.ink2 }}>
            14:30 cursor · {current.toLocaleString()}kW · pred {predicted.toLocaleString()}kW · res +{dt.toFixed(0)}kW (1.8σ)
          </span>
        </div>
      </Panel>

      <Panel title="fleet grid · 64 mach" right="hover for detail">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2 }}>
          {machines.map(m => {
            const colors: Record<string, string> = {
              running: C.amber, idle: C.ink4, doff: C.ink3, fault: C.warn, maint: C.ink3,
            }
            return (
              <div key={m.id} title={`${m.id} ${m.status} ${m.kw}kW`}
                style={{
                  aspectRatio: '1.2', background: colors[m.status],
                  opacity: m.status === 'running' ? 0.5 + m.efficiency * 0.5 : 1,
                }} />
            )
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 9.5, color: C.ink3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <span>■ run·{running.length}</span>
          <span>■ doff·{machines.filter(m => m.status === 'doff').length}</span>
          <span>■ idle·{machines.filter(m => m.status === 'idle').length}</span>
          <span style={{ color: C.warn }}>■ fault·{machines.filter(m => m.status === 'fault').length}</span>
        </div>
      </Panel>

      <Panel title="recent events · log tail" style={{ gridColumn: 'span 2' }}>
        <div style={{ fontSize: 10.5, lineHeight: 1.6, color: C.ink2, fontFamily: C.mono }}>
          {anomalies.slice(0, 7).map(a => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '50px 70px 60px 1fr', gap: 8 }}>
              <span style={{ color: C.ink3 }}>{a.time}</span>
              <span style={{ color: C.ink }}>{a.machine}</span>
              <span style={{ color: a.severity === 'high' ? C.warn : a.severity === 'med' ? C.amber : C.ink3 }}>
                [{a.severity}]
              </span>
              <span style={{ color: C.ink2 }}>{a.kind}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="top reco · queued" right="3 of 6">
        <div style={{ fontSize: 10.5, lineHeight: 1.5 }}>
          {recommendations.slice(0, 3).map(r => (
            <div key={r.id} style={{ padding: '4px 0', borderBottom: `1px solid ${C.ruleS}` }}>
              <div style={{ color: C.amber }}>{r.id} · −{r.savings_kwh} kWh</div>
              <div style={{ color: C.ink2, fontSize: 10 }}>{r.title.slice(0, 32)}…</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="hourly demand · last 24h">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 50 }}>
          {Array.from({ length: 24 }, (_, h) => {
            const idx = series.findIndex(d => Math.abs(d.hour - h) < 0.2)
            if (idx < 0) return null
            const v = series[idx].actual
            return <div key={h} style={{ width: 12, height: `${(v / 6800) * 100}%`, background: C.amber, opacity: 0.7 }} />
          })}
        </div>
        <div style={{ fontSize: 9.5, color: C.ink3, marginTop: 4 }}>
          peak 6.41 MW · trough 3.92 MW · spread 2.49 MW
        </div>
      </Panel>
    </div>
  )
}
