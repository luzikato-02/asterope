import { useMemo, useState } from 'react'
import { C } from '../tokens'
import { Panel, Knob } from '../components/shared'
import type { PlantData } from '../types'

const shiftColors: Record<string, string> = { A: C.amber, B: C.ink2, C: C.ink3 }
const shiftFactor: Record<string, number> = { A: 1.00, B: 1.02, C: 0.94 }

export function Predict({ data }: { data: PlantData }) {
  const { shiftHistory, machines } = data
  const [shiftLetter, setShiftLetter] = useState<'A' | 'B' | 'C'>('B')
  const [machine, setMachine] = useState('TFO-014')
  const [runtime, setRuntime] = useState(7.4)
  const [rpm, setRpm] = useState(9400)
  const [spindles, setSpindles] = useState(144)
  const [denier, setDenier] = useState(295)

  const yarnFactor = denier < 240 ? 0.94 : denier < 320 ? 1.00 : 1.08

  const predicted = useMemo(() =>
    Math.round(0.55 * spindles * runtime * Math.pow(rpm / 9000, 1.55) * shiftFactor[shiftLetter] * yarnFactor),
    [shiftLetter, runtime, rpm, spindles, denier]
  )

  const completed = shiftHistory.filter(s => !s.partial)
  const max = Math.max(...completed.map(s => s.energy_kwh)) * 1.05

  const recent = useMemo(() => {
    const matching = shiftHistory.filter(s => s.shift === shiftLetter && !s.partial).slice(-6)
    return matching.map(s => ({
      ...s,
      machine_kwh: Math.round(s.energy_kwh / 64 + (machine.charCodeAt(2) * 7 % 40) - 20),
    }))
  }, [shiftHistory, shiftLetter, machine])

  const recentMean = recent.length ? recent.reduce((s, r) => s + r.machine_kwh, 0) / recent.length : 0

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1.7fr 1fr', gridTemplateRows: '1fr 0.85fr',
      gap: 10, overflow: 'hidden',
    }}>
      <Panel title="predicted vs actual · per shift · last 41 shifts" right="model: GBT-180 · scope: plant" style={{ gridRow: 'span 2' }}>
        <svg width={840} height={300} style={{ display: 'block' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <line key={i} x1={50} x2={830} y1={20 + f * 230} y2={20 + f * 230} stroke={C.ruleS} strokeDasharray="2 3" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <text key={i} x={42} y={253 - f * 230} fontSize="9" fill={C.ink3} textAnchor="end">
              {Math.round((f * max) / 1000)}k
            </text>
          ))}
          {completed.map((s, i) => {
            const bw = 780 / completed.length
            const x = 55 + i * bw
            const h = (s.energy_kwh / max) * 230
            const noise = ((s.id.charCodeAt(8) * 7) % 100) - 50
            const predicted_val = Math.max(0, s.energy_kwh + noise * 20)
            const ph = (predicted_val / max) * 230
            return (
              <g key={s.id}>
                <rect x={x + 0.5} y={250 - h} width={bw - 1} height={h} fill={shiftColors[s.shift]} opacity={0.9} />
                <line x1={x + bw / 2} x2={x + bw / 2} y1={250 - ph - 3} y2={250 - ph + 3} stroke={C.ok} strokeWidth="1.5" />
                {i % 9 === 0 && (
                  <text x={x + bw / 2} y={266} fontSize="9" fill={C.ink3} textAnchor="middle">{s.dateLabel}·{s.shift}</text>
                )}
              </g>
            )
          })}
        </svg>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          {(['A', 'B', 'C'] as const).map(L => (
            <span key={L}>
              <span style={{ display: 'inline-block', width: 10, height: 8, background: shiftColors[L], marginRight: 4, verticalAlign: 'middle' }} />
              {L}
            </span>
          ))}
          <span><span style={{ display: 'inline-block', width: 10, height: 2, background: C.ok, marginRight: 4, verticalAlign: 'middle' }} />predicted (tick)</span>
        </div>

        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, padding: '10px 0', borderTop: `1px solid ${C.rule}` }}>
          {[['mape · shift', '3.41', '%'], ['rmse · shift', '218', 'kWh'], ['r²', '0.974', ''], ['drift', '0.08', 'σ']].map(([label, val, unit]) => (
            <div key={label}>
              <div style={{ color: C.ink3, fontSize: 10 }}>{label}</div>
              <div style={{ fontSize: 18, color: label === 'drift' ? C.ok : C.ink }}>
                {val}<span style={{ color: C.ink3, fontSize: 10 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 10, color: C.ink3, marginBottom: 4 }}>shift residuals · last 41 shifts</div>
          <svg width={840} height={50}>
            <line x1={50} x2={830} y1={25} y2={25} stroke={C.ink4} strokeDasharray="2 3" />
            {completed.map((s, idx) => {
              const noise = ((s.id.charCodeAt(8) * 11) % 100) - 50
              const r = noise * 12
              const yr = 25 - (r / 500) * 22
              const x = 55 + idx * (780 / completed.length) + (780 / completed.length) / 2
              return <line key={idx} x1={x} x2={x} y1={25} y2={yr}
                stroke={Math.abs(r) > 350 ? C.warn : C.amber} strokeWidth="1.5" />
            })}
          </svg>
        </div>
      </Panel>

      <Panel title="what-if · per-shift predictor" right="GBT-180 · per machine">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>shift_letter</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['A', 'B', 'C'] as const).map(L => (
                <button key={L} onClick={() => setShiftLetter(L)} style={{
                  flex: 1, background: shiftLetter === L ? C.amber : 'transparent',
                  border: `1px solid ${shiftLetter === L ? C.amber : C.ink4}`,
                  color: shiftLetter === L ? C.bg : C.ink2,
                  padding: '5px 0', fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
                }}>
                  {L} · {L === 'A' ? '06–14' : L === 'B' ? '14–22' : '22–06'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>machine</div>
            <select value={machine} onChange={e => setMachine(e.target.value)} style={{
              width: '100%', background: C.bg, border: `1px solid ${C.ink4}`,
              color: C.ink, padding: '5px 8px', fontFamily: C.mono, fontSize: 11,
            }}>
              {machines.slice(0, 16).map(m => (
                <option key={m.id} value={m.id}>{m.id} · {m.yarn}</option>
              ))}
            </select>
          </div>
          <Knob label="runtime_in_shift (max 8h)" val={runtime} set={setRuntime} min={0} max={8} step={0.1} u="h" />
          <Knob label="spindle_rpm_avg" val={rpm} set={setRpm} min={6000} max={13000} step={100} u="rpm" />
          <Knob label="spindles_active" val={spindles} set={setSpindles} min={48} max={192} step={12} u="" />
          <Knob label="yarn_denier" val={denier} set={setDenier} min={150} max={500} step={5} u="D" />
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', background: C.bg, border: `1px solid ${C.ruleS}` }}>
          <div style={{ fontSize: 10, color: C.ink3 }}>predicted_kwh · 1 shift · 1 machine</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 40, color: C.amber, lineHeight: 1.1 }}>{predicted}</span>
            <span style={{ fontSize: 11, color: C.ink3 }}>kWh / shift</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
            95% CI [{Math.round(predicted * 0.94)}, {Math.round(predicted * 1.06)}] · σ ±{Math.round(predicted * 0.03)} kWh
          </div>
        </div>
      </Panel>

      <Panel title={`recent same-shift · machine ${machine} · ${shiftLetter}`} right="6 most recent">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px',
          padding: '3px 0', borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: 'uppercase',
        }}>
          <span>shift_id</span><span style={{ textAlign: 'right' }}>kWh</span>
          <span style={{ textAlign: 'right' }}>h</span><span style={{ textAlign: 'right' }}>src</span>
        </div>
        {recent.map(s => (
          <div key={s.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px',
            padding: '4px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: 'center',
          }}>
            <span style={{ color: C.ink2, fontSize: 10.5 }}>{s.id}</span>
            <span style={{ textAlign: 'right', color: C.amber }}>{s.machine_kwh}</span>
            <span style={{ textAlign: 'right', color: C.ink3 }}>{s.runtime_h}</span>
            <span style={{ textAlign: 'right', color: s.source === 'xlsx' ? C.ok : C.ink3, fontSize: 9.5 }}>
              {s.source.replace('plc-live', 'live')}
            </span>
          </div>
        ))}
        <div style={{
          marginTop: 8, padding: '6px 8px', background: C.bg, border: `1px solid ${C.ruleS}`,
          fontSize: 10.5, color: C.ink3, lineHeight: 1.7,
        }}>
          shift_factor = <span style={{ color: C.amber }}>{shiftFactor[shiftLetter].toFixed(2)}</span> ·
          yarn_factor = <span style={{ color: C.amber }}>{yarnFactor.toFixed(2)}</span><br />
          predicted vs 6-shift mean:{' '}
          <span style={{ color: C.amber }}>
            {recentMean ? ((predicted - recentMean) / recentMean * 100).toFixed(1) : '—'}%
          </span>
        </div>
      </Panel>
    </div>
  )
}
