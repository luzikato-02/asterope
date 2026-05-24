import { useState } from 'react'
import { C } from '../tokens'
import { Panel } from '../components/shared'
import { Knob } from '../components/shared'

export function Settings({ onLogout }: { onLogout?: () => void }) {
  const [thr, setThr] = useState({ z: 3.5, kw: 280, idle: 9, tariff: 6.80 })

  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, overflow: 'hidden',
    }}>
      <Panel title="detection_thresholds">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Knob label="anomaly_z_score"     val={+thr.z.toFixed(2)}      set={v => setThr(t => ({...t, z: v}))}      min={2}  max={6}   step={0.05} u="σ"  />
          <Knob label="kw_deviation"        val={thr.kw}                 set={v => setThr(t => ({...t, kw: v}))}     min={50} max={600} step={10}   u="kW" />
          <Knob label="idle_lockout"        val={thr.idle}               set={v => setThr(t => ({...t, idle: v}))}   min={3}  max={20}  step={0.5}  u="min"/>
          <Knob label="tariff_inr_per_kwh"  val={+thr.tariff.toFixed(2)} set={v => setThr(t => ({...t, tariff: v}))} min={3}  max={12}  step={0.05} u=""   />
        </div>
        <div style={{ marginTop: 18, padding: '8px 10px', background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 11, color: C.ink2, lineHeight: 1.7 }}>
          tpi_tolerance ≤ 3%<br />
          rpm_min = 7 200<br />
          rpm_max = 12 600<br />
          doff_stagger_min = 12 min<br />
          off_peak = [22:00, 06:00)
        </div>
      </Panel>

      <Panel title="data_sources">
        {[
          ['plc.siemens_s7',    '192.168.4.0/22',   'live'],
          ['powerlogic.ion9000','192.168.6.10:502',  'live'],
          ['mes.tagit_v4',      'mes.gomati.local',  'live'],
          ['ambient.openweather','api.openweathermap.org','live'],
          ['maint.sap_pm',      'sap.gomati.local',  'stale'],
        ].map(([n, addr, st]) => (
          <div key={n} style={{ padding: '8px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.ink }}>{n}</span>
              <span style={{ color: st === 'live' ? C.ok : C.warn, fontSize: 10 }}>[{st}]</span>
            </div>
            <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>{addr}</div>
          </div>
        ))}
      </Panel>

      <Panel title="notifications">
        {[
          ['high_severity_anomaly', 'sms,email'],
          ['daily_energy_report',   'email · 06:00'],
          ['weekly_opt_digest',     'email · mon 08:00'],
          ['model_drift_alert',     'slack #energy-ops'],
          ['retrain_complete',      'email,slack'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '8px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ color: C.ink }}>{k}</div>
            <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>→ {v}</div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: '8px 10px', background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 10.5, color: C.ink3 }}>
          asterope · 2.6.1<br />
          build 4c821e · 22 may 2026<br />
          host: console-01.gomati.local
        </div>
        {onLogout && (
          <button onClick={onLogout} style={{
            marginTop: 12, width: '100%', background: 'transparent',
            border: `1px solid ${C.rule}`, color: C.ink3,
            fontFamily: C.mono, fontSize: 10.5, padding: '8px 0', cursor: 'pointer',
            letterSpacing: 0.5,
          }}>
            logout ↩
          </button>
        )}
      </Panel>
    </div>
  )
}
