import { useEffect, useMemo, useState } from 'react'
import { C } from '../tokens'
import { Panel } from '../components/shared'
import type { BackfillCell, PlantData, UploadEntry } from '../types'

type Mode  = 'plc' | 'xlsx' | 'hybrid'
type Stage = 'idle' | 'parsing' | 'preview' | 'committing' | 'committed'
           | 'backfill-parsing' | 'backfill-review' | 'backfill-committing' | 'backfill-committed'

const resColor = (r: string) =>
  ({ insert: C.ok, skip: C.ink3, overwrite: C.warn, merge: C.amber }[r] ?? C.ink3)

const statusMeta = (s: string) => ({
  'new':           { bg: 'rgba(122,145,102,0.18)', fg: C.ok,    label: 'new' },
  'conflict-plc':  { bg: 'rgba(201,138,58,0.15)',  fg: C.amber, label: 'plc' },
  'conflict-xlsx': { bg: 'rgba(196,90,58,0.15)',   fg: C.warn,  label: 'xlsx' },
  'partial':       { bg: 'rgba(168,165,156,0.10)', fg: C.ink2,  label: 'part' },
}[s] ?? { bg: 'transparent', fg: C.ink3, label: s })

export function Ingest({ data }: { data: PlantData }) {
  const { uploadLog: initialLog, uploadSchema, sampleParsedRows, backfill, dbInfo } = data

  const [mode, setMode]         = useState<Mode>('hybrid')
  const [stage, setStage]       = useState<Stage>('idle')
  const [file, setFile]         = useState<{ name: string; size: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [log, setLog]           = useState<UploadEntry[]>(initialLog)
  const [grid, setGrid]         = useState<BackfillCell[]>(backfill.grid)

  const rows = sampleParsedRows
  const stats = useMemo(() => ({
    total: rows.length,
    ok:   rows.filter(r => r._status === 'ok').length,
    warn: rows.filter(r => r._status === 'warn').length,
    err:  rows.filter(r => r._status === 'err').length,
  }), [rows])

  const gridStats = useMemo(() => {
    const t = (s: string) => grid.filter(g => g.status === s).length
    const r = (s: string) => grid.filter(g => g.resolution === s).length
    const rowsToWrite = grid.reduce((s, g) => {
      if (g.resolution === 'skip') return s
      if (g.resolution === 'merge') return s + Math.max(0, g.rows_in_file - g.rows_in_db)
      return s + g.rows_in_file
    }, 0)
    return {
      new: t('new'), confPlc: t('conflict-plc'), confXlsx: t('conflict-xlsx'), partial: t('partial'),
      skip: r('skip'), insert: r('insert'), overwrite: r('overwrite'), merge: r('merge'),
      rowsToWrite,
    }
  }, [grid])

  function pickFile(f: { name: string; size: number }) {
    setFile(f); setStage('parsing'); setProgress(0)
  }
  function loadBackfill() {
    setFile({ name: backfill.meta.file, size: backfill.meta.size_kb * 1024 })
    setStage('backfill-parsing'); setProgress(0)
  }
  function reset() { setStage('idle'); setFile(null); setProgress(0); setGrid(backfill.grid) }

  function setResolutionAll(res: string) {
    setGrid(g => g.map(cell => cell.status === 'new' ? cell : { ...cell, resolution: res as BackfillCell['resolution'] }))
  }
  function setOneResolution(id: string, res: string) {
    setGrid(g => g.map(cell => cell.id === id ? { ...cell, resolution: res as BackfillCell['resolution'] } : cell))
  }

  useEffect(() => {
    if (stage !== 'parsing') return
    const t = setInterval(() => setProgress(p => { if (p >= 100) { setStage('preview'); return 100 } return p + 8 }), 60)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'backfill-parsing') return
    const t = setInterval(() => setProgress(p => { if (p >= 100) { setStage('backfill-review'); return 100 } return p + 5 }), 50)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'committing') return
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) {
        setStage('committed')
        setLog(prev => [{
          id: `UP-${242 + prev.filter(x => x.status === 'committed').length}`,
          file: file?.name ?? 'shift_2026-05-23.xlsx',
          rows: stats.ok + stats.warn,
          date: 'now', user: 'n.agarwal', status: 'committed', warnings: stats.warn,
        }, ...prev])
        return 100
      }
      return p + 10
    }), 60)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'backfill-committing') return
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) {
        setStage('backfill-committed')
        setLog(prev => [{
          id: `UP-${242 + prev.filter(x => x.status === 'committed').length}`,
          file: file?.name ?? 'backfill_may_w2.xlsx',
          rows: gridStats.rowsToWrite, date: 'now', user: 'n.agarwal',
          status: 'committed', warnings: gridStats.partial,
        }, ...prev])
        return 100
      }
      return p + 6
    }), 60)
    return () => clearInterval(t)
  }, [stage])

  // ── Backfill full-screen states ──────────────────────────────────────────
  if (stage === 'backfill-parsing') {
    return (
      <div style={{ height: '100%', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 8 }}>{file?.name}</div>
        <div style={{ fontSize: 11, color: C.ink3, marginBottom: 18 }}>
          {((file?.size ?? 0) / 1024).toFixed(1)} KB · multi-day backfill detected
        </div>
        <div style={{ width: 360, height: 5, background: C.ruleS }}>
          <div style={{ height: '100%', width: `${progress}%`, background: C.amber, transition: 'width 0.1s' }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.ink3, fontFamily: C.mono, lineHeight: 1.8, minWidth: 480 }}>
          {progress >= 10 && <div>&gt; workbook opened · 1 sheet "shift_facts"</div>}
          {progress >= 25 && <div>&gt; 1 339 rows × 9 cols · schema v3 ✓</div>}
          {progress >= 40 && <div>&gt; detected date range: 2026-05-08 → 2026-05-14 (7 days)</div>}
          {progress >= 55 && <div>&gt; mode: backfill (multi-day)</div>}
          {progress >= 70 && <div>&gt; cross-referencing 21 shift-windows against shift_facts</div>}
          {progress >= 85 && <div style={{ color: C.amber }}>&gt; 14 conflicts · 4 new · 3 partial · ready for review</div>}
        </div>
      </div>
    )
  }

  if (stage === 'backfill-committing') {
    return (
      <div style={{ height: '100%', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 18 }}>writing {gridStats.rowsToWrite} rows to shift_facts…</div>
        <div style={{ width: 420, height: 5, background: C.ruleS }}>
          <div style={{ height: '100%', width: `${progress}%`, background: C.amber, transition: 'width 0.1s' }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.ink3, fontFamily: C.mono, lineHeight: 1.8, minWidth: 520 }}>
          {progress >= 10 && <div>&gt; begin transaction (backfill mode)</div>}
          {progress >= 25 && <div>&gt; insert {gridStats.insert * 64} rows · {gridStats.insert} new shifts</div>}
          {progress >= 45 && <div>&gt; overwrite {gridStats.overwrite * 64} rows · audit kept under uploads.history</div>}
          {progress >= 65 && <div>&gt; merge {gridStats.merge * 64} rows · resolved on (machine_id, shift_id)</div>}
          {progress >= 80 && <div>&gt; skip {gridStats.skip} shift-windows · PLC takes precedence</div>}
          {progress >= 95 && <div style={{ color: C.ok }}>&gt; commit · model_features marked stale · retrain queued for 04:00</div>}
        </div>
      </div>
    )
  }

  if (stage === 'backfill-committed') {
    return (
      <div style={{ height: '100%', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 32, color: C.ok }}>✓ backfill committed</div>
        <div style={{ marginTop: 10, fontSize: 13, color: C.ink2 }}>
          {gridStats.rowsToWrite} rows written · 1 entry in <span style={{ color: C.amber }}>uploads</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: C.ink3, maxWidth: 540, textAlign: 'center', lineHeight: 1.6 }}>
          model_features marked stale. Next retrain (scheduled 04:00) will include the 7-day backfill window.
        </div>
        <button onClick={reset} style={{
          marginTop: 24, background: 'transparent', border: `1px solid ${C.amber}`, color: C.amber,
          padding: '8px 18px', fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
        }}>
          ← BACK TO INGEST
        </button>
      </div>
    )
  }

  if (stage === 'backfill-review') {
    const dates = backfill.dates
    return (
      <div style={{
        height: '100%', padding: 12,
        display: 'grid', gridTemplateColumns: '1.7fr 1fr', gridTemplateRows: 'auto 1fr auto',
        gap: 10, overflow: 'hidden',
      }}>
        <Panel title={`backfill review · ${backfill.meta.file}`}
          right={`${backfill.meta.range_start} → ${backfill.meta.range_end} · ${backfill.meta.days}d`}
          style={{ gridColumn: 'span 2' }} pad={10}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, fontSize: 11 }}>
            {[
              ['parsed rows',   String(backfill.meta.parsed_rows), C.ink],
              ['new windows',   String(gridStats.new),      C.ok],
              ['plc conflicts', String(gridStats.confPlc),  C.amber],
              ['xlsx conflicts',String(gridStats.confXlsx), C.warn],
              ['partial cover', String(gridStats.partial),  C.ink2],
              ['rows to write', String(gridStats.rowsToWrite), C.amber],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ color: C.ink3, fontSize: 10 }}>{label}</div>
                <div style={{ fontSize: 18, color }}>{val}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="conflict map · click a cell to resolve" right="3 shifts/day × 7 days = 21 windows">
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: 4, fontSize: 10, marginBottom: 14 }}>
            <div />
            {dates.map(d => (
              <div key={d.date} style={{ textAlign: 'center', color: C.ink3 }}>
                <div>{d.weekday}</div>
                <div style={{ color: C.ink2 }}>{d.label}</div>
              </div>
            ))}
            {(['A', 'B', 'C'] as const).map(L => (
              <>
                <div key={`label-${L}`} style={{ display: 'flex', alignItems: 'center', color: C.ink2, fontSize: 11 }}>
                  shift {L} <span style={{ color: C.ink3, fontSize: 9, marginLeft: 4 }}>{L === 'A' ? '06–14' : L === 'B' ? '14–22' : '22–06'}</span>
                </div>
                {dates.map(d => {
                  const cell = grid.find(g => g.date === d.date && g.shift === L)
                  if (!cell) return <div key={d.date} />
                  const sc = statusMeta(cell.status)
                  return (
                    <button key={cell.id} onClick={() => {
                      const opts = cell.status === 'new' ? ['insert', 'skip'] :
                                   cell.status === 'partial' ? ['merge', 'overwrite', 'skip'] :
                                   ['skip', 'overwrite', 'merge']
                      const next = opts[(opts.indexOf(cell.resolution) + 1) % opts.length]
                      setOneResolution(cell.id, next)
                    }} style={{
                      background: sc.bg, border: `1px solid ${cell.resolution === 'skip' ? C.ink4 : sc.fg}`,
                      color: C.ink, padding: 6, cursor: 'pointer', fontFamily: C.mono,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 10, color: sc.fg }}>{sc.label}</span>
                      <span style={{ fontSize: 10, color: resColor(cell.resolution), marginTop: 2 }}>▸ {cell.resolution}</span>
                    </button>
                  )
                })}
              </>
            ))}
          </div>
          <div style={{ paddingTop: 10, borderTop: `1px solid ${C.rule}` }}>
            <div style={{ fontSize: 10, color: C.ink3, marginBottom: 6 }}>legend</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10.5 }}>
              <span><span style={{ color: C.ok }}>■</span> new — no existing data</span>
              <span><span style={{ color: C.amber }}>■</span> plc conflict — existing live data</span>
              <span><span style={{ color: C.warn }}>■</span> xlsx conflict — existing upload</span>
              <span><span style={{ color: C.ink2 }}>■</span> partial — some machines missing</span>
            </div>
          </div>
        </Panel>

        <Panel title="resolution strategy" right="bulk apply to all conflicts">
          <div style={{ fontSize: 11, color: C.ink3, marginBottom: 8 }}>for plc & xlsx conflicts ({gridStats.confPlc + gridStats.confXlsx} windows):</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'skip',      label: 'skip · keep existing',   sub: 'no DB change · file rows discarded',               color: C.ink3 },
              { id: 'overwrite', label: 'overwrite · file wins',  sub: 'old values archived to uploads.history',            color: C.warn },
              { id: 'merge',     label: 'merge · prefer non-null',sub: 'fill DB nulls from file; otherwise keep DB',        color: C.amber },
            ].map(o => (
              <button key={o.id} onClick={() => setResolutionAll(o.id)} style={{
                border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink,
                padding: '7px 10px', textAlign: 'left', fontFamily: C.mono, fontSize: 11, cursor: 'pointer',
              }}>
                <div style={{ color: o.color }}>▸ {o.label}</div>
                <div style={{ color: C.ink3, fontSize: 10, marginTop: 2 }}>{o.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, fontSize: 10.5, color: C.ink2, lineHeight: 1.8 }}>
            <div>current per-cell mix:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px', marginTop: 4 }}>
              <span style={{ color: C.ok }}>insert (new)</span><span style={{ textAlign: 'right' }}>{gridStats.insert}</span>
              <span style={{ color: C.amber }}>merge</span><span style={{ textAlign: 'right' }}>{gridStats.merge}</span>
              <span style={{ color: C.warn }}>overwrite</span><span style={{ textAlign: 'right' }}>{gridStats.overwrite}</span>
              <span style={{ color: C.ink3 }}>skip</span><span style={{ textAlign: 'right' }}>{gridStats.skip}</span>
            </div>
          </div>
        </Panel>

        <Panel title="commit summary" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11.5, color: C.ink2 }}>
              <span style={{ color: C.amber }}>{gridStats.rowsToWrite.toLocaleString()} rows</span> will be written to
              <span style={{ color: C.amber }}> shift_facts</span> ·
              old values from <span style={{ color: C.warn }}>{gridStats.overwrite}</span> overwritten shifts archived ·
              model_features marked stale, retrain at 04:00.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={reset} style={{ background: 'transparent', border: `1px solid ${C.ink3}`, color: C.ink2, padding: '8px 14px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer' }}>CANCEL</button>
              <button onClick={() => { setProgress(0); setStage('backfill-committing') }} style={{ background: C.amber, border: 0, color: C.bg, padding: '8px 14px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer', letterSpacing: 0.4 }}>COMMIT BACKFILL ⏎</button>
            </div>
          </div>
        </Panel>
      </div>
    )
  }

  // ── Main ingest layout ───────────────────────────────────────────────────
  return (
    <div style={{
      height: '100%', padding: 12,
      display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1fr', gridTemplateRows: 'auto 1fr auto',
      gap: 10, overflow: 'hidden',
    }}>
      <Panel title="data_source · mode">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([
            { id: 'plc',    label: 'plc · live only',         sub: '1-min PLC snapshots aggregated to shift', k: '1' },
            { id: 'xlsx',   label: 'xlsx · upload only',      sub: 'operator-keyed Excel after each shift',   k: '2' },
            { id: 'hybrid', label: 'hybrid · plc + xlsx fallback', sub: 'auto-switch when PLC gap > 15 min', k: '3' },
          ] as { id: Mode; label: string; sub: string; k: string }[]).map(o => (
            <button key={o.id} onClick={() => setMode(o.id)} style={{
              border: `1px solid ${mode === o.id ? C.amber : C.rule}`,
              background: mode === o.id ? C.panel2 : 'transparent',
              color: C.ink, padding: '8px 10px', textAlign: 'left', fontFamily: C.mono, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: mode === o.id ? C.amber : C.ink, fontSize: 11.5 }}>
                  {mode === o.id ? '●' : '○'} {o.label}
                </span>
                <span style={{ color: C.ink3, fontSize: 10 }}>[{o.k}]</span>
              </div>
              <div style={{ color: C.ink3, fontSize: 10, marginTop: 3 }}>{o.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '8px 10px', background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 10.5, color: C.ink3, lineHeight: 1.6 }}>
          smallest_window = shift (8h)<br />
          shift_A 06:00–14:00 · B 14:00–22:00 · C 22:00–06:00<br />
          aggregation: sum(energy_kwh), sum(runtime_h), avg(rpm)
        </div>
      </Panel>

      <Panel title="excel_upload · drag & drop" right=".xlsx / .xls / .csv · ≤ 20 MB">
        {stage === 'idle' && (
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) pickFile({ name: f.name, size: f.size }) }}
            style={{
              flex: 1, border: `1.5px dashed ${dragOver ? C.amber : C.ink4}`,
              background: dragOver ? 'rgba(201,138,58,0.06)' : C.bg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 30, textAlign: 'center', minHeight: 160,
            }}>
            <div style={{ fontSize: 28, color: dragOver ? C.amber : C.ink3 }}>⤓</div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.ink2 }}>
              drop <span style={{ color: C.amber }}>shift_YYYY-MM-DD.xlsx</span> here
            </div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: C.ink3 }}>or click to browse · max 20 MB · sheet named "shift_facts"</div>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile({ name: f.name, size: f.size }) }} />
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={e => { e.preventDefault(); pickFile({ name: 'shift_2026-05-23.xlsx', size: 38412 }) }}
                style={{ background: 'transparent', border: `1px solid ${C.ink3}`, color: C.ink2, padding: '6px 12px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer' }}>
                ▶ demo: single shift
              </button>
              <button onClick={e => { e.preventDefault(); loadBackfill() }}
                style={{ background: 'transparent', border: `1px solid ${C.amber}`, color: C.amber, padding: '6px 12px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer' }}>
                ▶ demo: backfill 7 days
              </button>
            </div>
          </label>
        )}

        {stage === 'parsing' && (
          <div style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.ink }}>{file?.name}</div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 2 }}>{((file?.size ?? 0) / 1024).toFixed(1)} KB · parsing…</div>
            <div style={{ height: 5, background: C.ruleS, marginTop: 14 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: C.amber, transition: 'width 0.1s' }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: C.ink3, lineHeight: 1.7 }}>
              {progress >= 10 && <div>&gt; opening workbook · 1 sheet found</div>}
              {progress >= 30 && <div>&gt; sheet "shift_facts" · 192 rows × 9 cols</div>}
              {progress >= 50 && <div>&gt; validating schema against UPLOAD_SCHEMA v3</div>}
              {progress >= 70 && <div>&gt; running pre-commit anomaly check</div>}
              {progress >= 90 && <div style={{ color: C.amber }}>&gt; 2 warnings · 1 error · ready for review</div>}
            </div>
          </div>
        )}

        {stage === 'preview' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: C.ink }}>{file?.name}</span>
                <span style={{ color: C.ink3, marginLeft: 10 }}>{stats.total} rows · {stats.ok} ok · </span>
                <span style={{ color: C.amber }}>{stats.warn} warn</span>
                <span style={{ color: C.ink3 }}> · </span>
                <span style={{ color: C.warn }}>{stats.err} err</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={reset} style={{ background: 'transparent', border: `1px solid ${C.ink3}`, color: C.ink2, padding: '5px 10px', fontFamily: C.mono, fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
                <button onClick={() => { setProgress(0); setStage('committing') }} style={{ background: C.amber, border: 0, color: C.bg, padding: '5px 10px', fontFamily: C.mono, fontSize: 10, cursor: 'pointer', letterSpacing: 0.4 }}>
                  COMMIT {stats.ok + stats.warn} ROWS ⏎
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', marginTop: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, fontFamily: C.mono }}>
                <thead>
                  <tr style={{ color: C.ink3, textAlign: 'left' }}>
                    {['', 'machine', 'date', 'S', 'h', 'kWh', 'kg', 'rpm', 'doffs', 'note'].map((h, i) => (
                      <th key={i} style={{ padding: '4px 6px', borderBottom: `1px solid ${C.rule}`, fontWeight: 400, textAlign: i >= 4 && i <= 8 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{
                      background: r._status === 'err' ? 'rgba(196,90,58,0.08)' : r._status === 'warn' ? 'rgba(201,138,58,0.05)' : 'transparent',
                      color: r._status === 'err' ? C.ink3 : C.ink2,
                    }}>
                      <td style={{ padding: '3px 6px', color: r._status === 'ok' ? C.ok : r._status === 'warn' ? C.amber : C.warn }}>
                        {r._status === 'ok' ? '✓' : r._status === 'warn' ? '⚠' : '✗'}
                      </td>
                      <td style={{ padding: '3px 6px' }}>{r.machine_id}</td>
                      <td style={{ padding: '3px 6px', color: C.ink3 }}>{r.shift_date}</td>
                      <td style={{ padding: '3px 6px', color: C.ink3 }}>{r.shift}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: r._status === 'err' ? C.warn : 'inherit' }}>{String(r.runtime_hours)}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: r._status === 'warn' && r._warn?.includes('energy') ? C.amber : 'inherit' }}>{r.energy_kwh}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>{r.output_kg}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>{r.spindle_rpm_avg}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>{r.doff_count}</td>
                      <td style={{ padding: '3px 6px', color: C.ink3, fontSize: 10 }}>{r._err ?? r._warn ?? r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stage === 'committing' && (
          <div style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.ink }}>committing to local db…</div>
            <div style={{ height: 5, background: C.ruleS, marginTop: 14 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: C.amber, transition: 'width 0.1s' }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: C.ink3, lineHeight: 1.7 }}>
              {progress >= 10 && <div>&gt; begin transaction</div>}
              {progress >= 30 && <div>&gt; insert into shift_facts · 11 rows</div>}
              {progress >= 50 && <div>&gt; insert into uploads · 1 row</div>}
              {progress >= 70 && <div>&gt; rebuild index shift_facts_pk</div>}
              {progress >= 90 && <div>&gt; commit · trigger model_features refresh</div>}
            </div>
          </div>
        )}

        {stage === 'committed' && (
          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 22, color: C.ok }}>✓ committed</div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.ink2 }}>
              11 rows written to <span style={{ color: C.amber }}>shift_facts</span> ·
              1 entry in <span style={{ color: C.amber }}>uploads</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: C.ink3 }}>
              model_features will refresh on next retrain (scheduled tomorrow 04:00).
            </div>
            <button onClick={reset} style={{
              marginTop: 18, background: 'transparent', border: `1px solid ${C.amber}`, color: C.amber,
              padding: '7px 14px', fontFamily: C.mono, fontSize: 10.5, cursor: 'pointer',
            }}>
              UPLOAD ANOTHER
            </button>
          </div>
        )}
      </Panel>

      <Panel title="required_schema" right="shift_facts v3">
        <div style={{ fontSize: 10.5, lineHeight: 1.7, flex: 1, overflow: 'auto' }}>
          {uploadSchema.map(s => (
            <div key={s.col} style={{ display: 'grid', gridTemplateColumns: '1fr 50px', padding: '4px 0', borderBottom: `1px solid ${C.ruleS}` }}>
              <div>
                <span style={{ color: s.required ? C.amber : C.ink2 }}>{s.col}</span>
                <span style={{ color: C.ink3, marginLeft: 6 }}>{s.type}</span>
                <div style={{ color: C.ink3, fontSize: 10 }}>ex: <span style={{ color: C.ink2 }}>{s.example}</span></div>
              </div>
              <span style={{ textAlign: 'right', color: s.required ? C.warn : C.ink3, fontSize: 10 }}>
                {s.required ? 'req' : 'opt'}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="plc · live channel" right={mode === 'xlsx' ? 'disabled' : 'active'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['connection', mode === 'xlsx' ? '○ standby' : '● connected', mode === 'xlsx' ? C.ink3 : C.ok],
            ['endpoint', 'opc.tcp://192.168.4.12', C.ink2],
            ['tags · runtime', 'DB12.MachineRuntime[1..64]', C.ink2],
            ['tags · energy', 'ION9000.Active_Energy_Wh', C.ink2],
            ['buffer', '4 102 rows queued', C.ink],
            ['lag', '240 ms · healthy', C.ok],
          ].map(([label, val, color]) => (
            <div key={label as string}>
              <div style={{ fontSize: 10, color: C.ink3 }}>{label}</div>
              <div style={{ fontSize: label === 'connection' ? 13 : 11, color: color as string }}>{val}</div>
              {label === 'connection' && <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>Siemens S7-1500 · OPC UA</div>}
              {label === 'endpoint' && <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>poll · 60s</div>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="upload_log · last imports" right={`${log.length} entries`}>
        <div style={{
          display: 'grid', gridTemplateColumns: '65px 1fr 55px 100px 80px 70px',
          padding: '4px 0', borderBottom: `1px solid ${C.rule}`,
          fontSize: 10, color: C.ink3, textTransform: 'uppercase',
        }}>
          <span>id</span><span>file</span><span style={{ textAlign: 'right' }}>rows</span>
          <span>when</span><span>user</span><span>status</span>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {log.map(u => (
            <div key={u.id} style={{
              display: 'grid', gridTemplateColumns: '65px 1fr 55px 100px 80px 70px',
              padding: '7px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: 'center',
            }}>
              <span style={{ color: C.amber }}>{u.id}</span>
              <span style={{ color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                {u.file}{u.warnings > 0 && <span style={{ color: C.amber, fontSize: 10 }}> · {u.warnings} warn</span>}
              </span>
              <span style={{ textAlign: 'right', color: C.ink2 }}>{u.rows}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{u.date}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{u.user}</span>
              <span style={{ color: u.status === 'committed' ? C.ok : C.warn, fontSize: 10, textTransform: 'uppercase' }}>
                [{u.status}]
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="local_db · asterope_local.duckdb" right={`${dbInfo.size_mb} MB`}>
        <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 8 }}>{dbInfo.path}</div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 90px',
          padding: '3px 0', borderBottom: `1px solid ${C.rule}`,
          fontSize: 10, color: C.ink3, textTransform: 'uppercase',
        }}>
          <span>table</span><span style={{ textAlign: 'right' }}>rows</span><span>last write</span>
        </div>
        {dbInfo.tables.map(t => (
          <div key={t.name} style={{ padding: '6px 0', borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px', alignItems: 'baseline' }}>
              <span style={{ color: C.ink }}>{t.name}</span>
              <span style={{ textAlign: 'right', color: C.ink2, fontSize: 10.5 }}>{t.rows.toLocaleString()}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{t.last_write}</span>
            </div>
            <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>{t.desc}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {['BACKUP', 'VACUUM', 'EXPORT'].map(label => (
            <button key={label} style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${label === 'BACKUP' ? C.amber : C.ink3}`,
              color: label === 'BACKUP' ? C.amber : C.ink2,
              padding: '5px', fontFamily: C.mono, fontSize: 10, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
