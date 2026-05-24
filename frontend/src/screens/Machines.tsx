import { useEffect, useMemo, useState } from 'react'
import { C } from '../tokens'
import { Panel, Kv } from '../components/shared'
import { LineChart } from '../components/charts/LineChart'
import { fetchMachineSeries } from '../api'
import type { MachinePoint, PlantData } from '../types'

const statusColors: Record<string, string> = {
  running: C.amber, idle: C.ink3, doff: C.ink2, fault: C.warn, maint: C.ink3,
}

export function Machines({ data }: { data: PlantData }) {
  const { machines, features } = data
  const [selId, setSelId] = useState('TFO-027')
  const [series, setSeries] = useState<MachinePoint[]>([])

  const m = machines.find(x => x.id === selId) ?? machines[0]

  useEffect(() => {
    const seed = m.id.charCodeAt(2) * 3
    fetchMachineSeries(seed).then(setSeries)
  }, [m.id])

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '240px 1fr', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="fleet · 64 machines" right="line A·B·C·D">
        <div style={{ overflow: 'auto', flex: 1, marginRight: -4, paddingRight: 4 }}>
          {machines.map(x => (
            <button key={x.id} onClick={() => setSelId(x.id)} style={{
              display: 'grid', gridTemplateColumns: '8px 60px 1fr 50px', gap: 6,
              width: '100%', border: 0, padding: '5px 4px', textAlign: 'left',
              background: selId === x.id ? C.panel2 : 'transparent',
              color: selId === x.id ? C.ink : C.ink2,
              fontFamily: C.mono, fontSize: 11, cursor: 'pointer', alignItems: 'center',
            }}>
              <span style={{ width: 6, height: 6, background: statusColors[x.status], borderRadius: 1, display: 'inline-block' }} />
              <span>{x.id}</span>
              <span style={{ color: C.ink3, fontSize: 10 }}>L{x.line}·{x.cluster}</span>
              <span style={{ textAlign: 'right', color: C.amber }}>{x.kw.toFixed(1)}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto 1fr 1fr', gap: 10, overflow: 'hidden',
      }}>
        <Panel title={`${m.id} · line ${m.line} · cluster ${m.cluster}`} right={`status: ${m.status}`} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {([
              ['load',       `${m.kw.toFixed(1)}kW`,        C.amber],
              ['kwh_24h',    String(m.kwh24),                C.ink],
              ['runtime',    `${m.runtime24.toFixed(1)}h`,   C.ink],
              ['eff',        `${(m.efficiency * 100).toFixed(0)}%`, C.ink],
              ['kwh/kg',     String(m.kwhPerKg),             C.ink],
              ['doffs_24h',  String(m.doffsToday),           C.ink],
            ] as [string, string, string][]).map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: C.ink3 }}>{label}</div>
                <div style={{ fontSize: 22, color }}>
                  {val.replace(/[^0-9.]/g, '')}
                  <span style={{ fontSize: 10, color: C.ink3 }}>{val.replace(/[0-9.]/g, '')}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="kw · 24h" right="1-min resolution" style={{ gridColumn: 'span 2' }}>
          {series.length > 0 && (
            <LineChart w={1140} h={160} data={series as unknown as Record<string, number>[]} xKey="t"
              yKeys={[{ key: 'kw', stroke: C.amber, strokeWidth: 1.3, fill: 'rgba(201,138,58,0.06)' }]}
              pad={{ t: 8, r: 12, b: 18, l: 38 }} />
          )}
        </Panel>

        <Panel title="process params">
          <table style={{ width: '100%', fontSize: 11.5, color: C.ink }}>
            <tbody>
              {([
                ['yarn',            m.yarn],
                ['denier',          `${m.denier}D`],
                ['ply',             String(m.ply)],
                ['spindles',        String(m.spindles)],
                ['spindle_rpm',     m.rpm.toLocaleString()],
                ['twist_multiplier',String(m.twistMultiplier)],
                ['tpi',             String(m.tpi)],
                ['commissioned',    String(m.commissioned)],
              ] as [string, string][]).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: C.ink3, padding: '3px 0' }}>{k}</td>
                  <td style={{ textAlign: 'right' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="feature attribution · why this kwh">
          {features.slice(0, 8).map(f => (
            <div key={f.name} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr 40px',
              alignItems: 'center', padding: '2.5px 0', fontSize: 11,
            }}>
              <span style={{ color: C.ink2 }}>{f.name}</span>
              <div style={{ height: 4, background: C.ruleS }}>
                <div style={{ height: '100%', width: `${(f.importance / 0.31) * 100}%`, background: C.amber, opacity: 0.85 }} />
              </div>
              <span style={{ color: C.ink3, textAlign: 'right' }}>{(f.importance * 100).toFixed(0)}%</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
