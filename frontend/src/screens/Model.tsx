import { useEffect, useState } from 'react'
import { C } from '../tokens'
import { Panel } from '../components/shared'
import type { PlantData } from '../types'

export function Model({ data }: { data: PlantData }) {
  const { modelRuns, features, clusters } = data
  const [training, setTraining] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!training) return
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { setTraining(false); return 100 }
      return p + 2
    }), 80)
    return () => clearInterval(t)
  }, [training])

  const startRetrain = () => { setProgress(0); setTraining(true) }

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1.3fr 1fr', gridTemplateRows: 'auto 1fr',
      gap: 10, overflow: 'hidden',
    }}>
      <Panel title="model_runs · data-source audit trail" right="4 versions" style={{ gridColumn: 'span 2' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '160px 120px 60px 70px 1fr 90px 150px 90px',
          padding: '4px 0', borderBottom: `1px solid ${C.rule}`,
          fontSize: 10, color: C.ink3, textTransform: 'uppercase', gap: 10,
        }}>
          <span>id</span><span>trained</span><span>mape</span><span>rmse</span>
          <span>params · window</span><span style={{ textAlign: 'right' }}>rows</span>
          <span>source mix · plc / xlsx / manual</span><span>status</span>
        </div>
        {modelRuns.map(r => (
          <div key={r.id} style={{
            display: 'grid', gridTemplateColumns: '160px 120px 60px 70px 1fr 90px 150px 90px',
            padding: '10px 0', borderBottom: `1px solid ${C.ruleS}`,
            fontSize: 11.5, alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: C.amber }}>{r.id}</span>
            <div style={{ fontSize: 10.5 }}>
              <div style={{ color: C.ink2 }}>{r.date}</div>
              <div style={{ color: C.ink3, fontSize: 9.5, marginTop: 1 }}>{r.training_window}</div>
            </div>
            <span>{r.mape}%</span>
            <span>{r.rmse}<span style={{ color: C.ink3, fontSize: 10 }}> kWh</span></span>
            <div style={{ fontSize: 10.5 }}>
              <div style={{ color: C.ink2 }}>{r.params}</div>
              <div style={{ color: C.ink3, fontSize: 9.5, marginTop: 1 }}>uploads: {r.uploads.join(', ')}</div>
            </div>
            <span style={{ textAlign: 'right', color: C.ink3 }}>{(r.rows / 1e6).toFixed(2)}M</span>
            <div>
              <div style={{ display: 'flex', height: 10, border: `1px solid ${C.ruleS}` }}>
                <div style={{ width: `${r.sources.plc * 100}%`, background: C.ink3 }} />
                <div style={{ width: `${r.sources.xlsx * 100}%`, background: C.ok }} />
                <div style={{ width: `${r.sources.manual * 100}%`, background: C.amber }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.ink3, marginTop: 3 }}>
                <span>{(r.sources.plc * 100).toFixed(0)}%</span>
                <span style={{ color: C.ok }}>{(r.sources.xlsx * 100).toFixed(0)}%</span>
                <span style={{ color: C.amber }}>{(r.sources.manual * 100).toFixed(0)}%</span>
              </div>
            </div>
            <span style={{ color: r.status === 'deployed' ? C.ok : C.ink3, fontSize: 10, textTransform: 'uppercase' }}>
              [{r.status}]
            </span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: C.ink3, display: 'flex', gap: 14 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 8, background: C.ink3, marginRight: 4, verticalAlign: 'middle' }} />plc · live tags</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 8, background: C.ok, marginRight: 4, verticalAlign: 'middle' }} />xlsx · operator upload</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 8, background: C.amber, marginRight: 4, verticalAlign: 'middle' }} />manual · console-edited</span>
        </div>
      </Panel>

      <Panel title="feature_importance · v2026.05.21-3">
        {features.map(f => (
          <div key={f.name} style={{
            display: 'grid', gridTemplateColumns: '170px 1fr 40px',
            alignItems: 'center', padding: '4px 0', fontSize: 11,
          }}>
            <span style={{ color: C.ink2 }}>{f.name}</span>
            <div style={{ height: 5, background: C.ruleS }}>
              <div style={{ height: '100%', width: `${(f.importance / 0.31) * 100}%`, background: C.amber, opacity: 0.9 }} />
            </div>
            <span style={{ color: C.ink3, textAlign: 'right' }}>{(f.importance * 100).toFixed(0)}%</span>
          </div>
        ))}
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Panel title="data_ingestion · last 24h">
          {[
            ['plc.runtime',       '182 401', '2m',  'ok'],
            ['plc.energy_meter',  '182 401', '2m',  'ok'],
            ['mes.production',    '1 204',   '9m',  'ok'],
            ['ambient.weather_api','96',     '14m', 'ok'],
            ['maint.work_orders', '31',      '1h',  'stale'],
          ].map(([s, r, t, st]) => (
            <div key={s} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 50px 60px',
              padding: '5px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11,
            }}>
              <span style={{ color: C.ink2 }}>{s}</span>
              <span style={{ color: C.ink3, textAlign: 'right' }}>{r}</span>
              <span style={{ color: C.ink3, textAlign: 'right' }}>{t}</span>
              <span style={{ color: st === 'ok' ? C.ok : C.warn, textAlign: 'right', fontSize: 10 }}>[{st}]</span>
            </div>
          ))}
        </Panel>

        <Panel title="retrain · pipeline">
          <div style={{ fontSize: 11, color: C.ink2, marginBottom: 10, lineHeight: 1.5 }}>
            $ asterope retrain --days 30 --rows 4.21M --gpu node-02
          </div>
          {training || progress > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>
                <span>{progress < 30 ? 'fetch_data' : progress < 60 ? 'feature_eng' : progress < 95 ? 'fit_trees' : 'validate'}…</span>
                <span style={{ color: C.amber }}>{progress}%</span>
              </div>
              <div style={{ height: 5, background: C.ruleS }}>
                <div style={{ height: '100%', width: `${progress}%`, background: C.amber, transition: 'width 0.2s' }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: C.ink3, fontFamily: C.mono, lineHeight: 1.6 }}>
                {progress >= 10  && <div>&gt; connected to feature_store</div>}
                {progress >= 30  && <div>&gt; 4 213 887 rows fetched · 312 cols</div>}
                {progress >= 50  && <div>&gt; engineered 24 derived features</div>}
                {progress >= 70  && <div>&gt; fitting 180 estimators · ETA 2m11s</div>}
                {progress >= 95  && <div>&gt; holdout mape: 3.28% (-0.13 vs current)</div>}
              </div>
            </div>
          ) : (
            <button onClick={startRetrain} style={{
              background: C.amber, border: 0, color: C.bg, padding: '8px 16px',
              fontFamily: C.mono, fontSize: 10.5, letterSpacing: 0.5, cursor: 'pointer',
            }}>
              ▶ RUN RETRAIN
            </button>
          )}
        </Panel>

        <Panel title="cluster_map">
          {clusters.map(c => (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '16px 1fr 50px 70px',
              gap: 8, padding: '3px 0', fontSize: 11.5, alignItems: 'center',
            }}>
              <span style={{ color: C.amber }}>{c.id}</span>
              <span style={{ color: C.ink2 }}>{c.label}</span>
              <span style={{ color: C.ink3, textAlign: 'right' }}>n={c.count}</span>
              <span style={{ textAlign: 'right' }}>{c.kwhPerKg}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
