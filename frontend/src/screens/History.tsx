import { C } from '../tokens'
import { Panel, Big } from '../components/shared'
import type { PlantData } from '../types'

const shiftColors: Record<string, string> = { A: C.amber, B: C.ink2, C: C.ink3 }
const sourceColor = (src: string) =>
  src === 'xlsx' ? C.ok : src === 'plc-live' ? C.amber : C.ink3

export function History({ data }: { data: PlantData }) {
  const shifts = data.shiftHistory
  const max = Math.max(...shifts.map(s => s.energy_kwh)) * 1.08
  const completed = shifts.filter(s => s.kwh_per_kg !== null)

  const totalMwh = (shifts.reduce((s, d) => s + d.energy_kwh, 0) / 1000).toFixed(0)
  const totalTons = (shifts.reduce((s, d) => s + d.output_kg, 0) / 1000).toFixed(1)
  const avgKwhKg = (
    completed.reduce((s, d) => s + (d.kwh_per_kg ?? 0), 0) / completed.length
  ).toFixed(2)

  const plcCount  = shifts.filter(s => s.source === 'plc').length
  const xlsxCount = shifts.filter(s => s.source === 'xlsx').length
  const liveCount = shifts.filter(s => s.source === 'plc-live').length

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridTemplateRows: 'auto 1fr 1fr', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="42 shifts · 14d energy"><Big v={totalMwh} u="MWh" /></Panel>
      <Panel title="42 shifts · output"><Big v={totalTons} u="t yarn" /></Panel>
      <Panel title="avg kwh/kg">
        <Big v={avgKwhKg} c={C.amber} />
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 4 }}>benchmark 1.55 · spec ≤ 1.70</div>
      </Panel>
      <Panel title="sources · 42 shifts">
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 28 }}>
          <div style={{ flex: plcCount,  height: 14, background: C.ink3  }} title={`plc · ${plcCount}`} />
          <div style={{ flex: xlsxCount, height: 14, background: C.ok    }} title={`xlsx · ${xlsxCount}`} />
          <div style={{ flex: liveCount, height: 14, background: C.amber }} title={`live · ${liveCount}`} />
        </div>
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span><span style={{ color: C.ink3 }}>■</span> plc {plcCount}</span>
          <span><span style={{ color: C.ok }}>■</span> xlsx {xlsxCount}</span>
          <span><span style={{ color: C.amber }}>■</span> live {liveCount}</span>
        </div>
      </Panel>

      <Panel title="shift_facts · energy_kwh per shift" right="42 shifts · A·B·C stacked · partial = striped" style={{ gridColumn: 'span 4' }}>
        <svg width={1380} height={240} style={{ display: 'block' }}>
          <defs>
            <pattern id="partial-stripe" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
              <rect width="4" height="4" fill={C.amber} opacity="0.35" />
              <line x1="0" y1="0" x2="0" y2="4" stroke={C.amber} strokeWidth="2" />
            </pattern>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <line key={i} x1={50} x2={1370} y1={20 + f * 180} y2={20 + f * 180} stroke={C.ruleS} strokeDasharray="2 3" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <text key={i} x={42} y={203 - f * 180} fontSize="9" fill={C.ink3} textAnchor="end">
              {Math.round((f * max) / 1000)}k
            </text>
          ))}
          {shifts.map((s, i) => {
            const bw = 1300 / shifts.length
            const x = 55 + i * bw
            const h = (s.energy_kwh / max) * 180
            return (
              <g key={s.id}>
                <rect x={x + 0.5} y={200 - h} width={bw - 1} height={h}
                  fill={s.partial ? 'url(#partial-stripe)' : shiftColors[s.shift]}
                  opacity={s.partial ? 1 : 0.9} />
                <rect x={x + 0.5} y={216} width={bw - 1} height={3} fill={sourceColor(s.source)} />
                {i % 3 === 1 && (
                  <text x={x + bw / 2} y={232} fontSize="9.5" fill={C.ink3} textAnchor="middle">{s.dateLabel}</text>
                )}
              </g>
            )
          })}
          <text x={1374} y={232} fontSize="9" fill={C.ink3} textAnchor="end">source bar ↑</text>
        </svg>
        <div style={{ display: 'flex', gap: 18, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          {(['A', 'B', 'C'] as const).map(L => (
            <span key={L}>
              <span style={{ display: 'inline-block', width: 10, height: 8, background: shiftColors[L], marginRight: 4, verticalAlign: 'middle' }} />
              shift {L} · {L === 'A' ? '06–14' : L === 'B' ? '14–22' : '22–06'}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: C.ink2 }}>cursor on a bar to view shift_id · runtime · source</span>
        </div>
      </Panel>

      <Panel title="kwh/kg per shift · benchmark 1.55" style={{ gridColumn: 'span 2' }}>
        <svg width={680} height={150}>
          <line x1={30} x2={670} y1={70} y2={70} stroke={C.warn} strokeDasharray="3 3" strokeWidth="0.8" />
          <text x={672} y={73} fontSize="9" fill={C.warn} textAnchor="start">1.55</text>
          {completed.map((s, i, arr) => {
            const x = 30 + i * (620 / arr.length) + 10
            const y = 130 - (((s.kwh_per_kg ?? 0) - 1.2) / 1.2) * 100
            return (
              <g key={s.id}>
                {i > 0 && (() => {
                  const prev = arr[i - 1]
                  const px = 30 + (i - 1) * (620 / arr.length) + 10
                  const py = 130 - (((prev.kwh_per_kg ?? 0) - 1.2) / 1.2) * 100
                  return <line x1={px} y1={py} x2={x} y2={y} stroke={C.amber} strokeWidth="0.8" opacity="0.7" />
                })()}
                <circle cx={x} cy={y} r="2" fill={shiftColors[s.shift]} />
              </g>
            )
          })}
        </svg>
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>colored by shift letter · 41 completed shifts</div>
      </Panel>

      <Panel title="recent shifts · table" style={{ gridColumn: 'span 2' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 30px 60px 60px 60px 60px 60px',
          padding: '4px 0', borderBottom: `1px solid ${C.rule}`,
          fontSize: 10, color: C.ink3, textTransform: 'uppercase',
        }}>
          <span>shift_id</span><span>s</span>
          <span style={{ textAlign: 'right' }}>kWh</span>
          <span style={{ textAlign: 'right' }}>h</span>
          <span style={{ textAlign: 'right' }}>kg</span>
          <span style={{ textAlign: 'right' }}>kWh/kg</span>
          <span>src</span>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {[...shifts].reverse().slice(0, 14).map(s => (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 30px 60px 60px 60px 60px 60px',
              padding: '5px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: 'center',
            }}>
              <span style={{ color: C.ink2, fontSize: 10.5 }}>
                {s.id}{s.partial && <span style={{ color: C.amber }}> ·live</span>}
              </span>
              <span style={{ color: shiftColors[s.shift] }}>{s.shift}</span>
              <span style={{ textAlign: 'right', color: C.amber }}>{s.energy_kwh.toLocaleString()}</span>
              <span style={{ textAlign: 'right', color: C.ink2 }}>{s.runtime_h}</span>
              <span style={{ textAlign: 'right', color: C.ink2 }}>{s.output_kg.toLocaleString()}</span>
              <span style={{ textAlign: 'right', color: C.ink2 }}>{s.kwh_per_kg ?? '—'}</span>
              <span style={{ color: sourceColor(s.source), fontSize: 10 }}>[{s.source}]</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
