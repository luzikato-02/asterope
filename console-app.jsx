/* global React */
// Console — dark, dense terminal variation. Mono everywhere. Information packed.

const { useState: useStateC, useMemo: useMemoC, useEffect: useEffectC } = React;
const DC = window.PlantData;

// ─── tokens ──────────────────────────────────────────────────────────
const consoleTokens = {
  bg: "#0a0a0a",
  panel: "#111111",
  panel2: "#161616",
  ink: "#e8e6e0",
  ink2: "#a8a59c",
  ink3: "#6e6a60",
  ink4: "#3f3c36",
  rule: "#1f1d1a",
  ruleS: "#161412",
  hi: "#e8e6e0",
  amber: "#c98a3a",
  warn: "#c45a3a",
  ok: "#7a9166",
  red: "#a14545",
  sans: "'Geist', 'Inter', system-ui, sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', 'IBM Plex Mono', monospace",
};
const C = consoleTokens;

// ─── chart prims ────────────────────────────────────────────────────
function CLineChart({ data, w, h, xKey, yKeys, pad = { t: 16, r: 16, b: 22, l: 40 }, showGrid = true }) {
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const xs = data.map((d) => d[xKey]);
  const ys = yKeys.flatMap((k) => data.map((d) => d[k.key]));
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = Math.min(...ys), ymax = Math.max(...ys);
  const py = (ymax - ymin) * 0.1; ymin -= py; ymax += py;
  const sx = (v) => pad.l + ((v - xmin) / (xmax - xmin || 1)) * iw;
  const sy = (v) => pad.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;
  const ticks = 4;
  return (
    <svg width={w} height={h} style={{ display: "block", fontFamily: C.mono }}>
      {showGrid && Array.from({ length: ticks + 1 }, (_, i) => {
        const v = ymin + (i / ticks) * (ymax - ymin);
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke={C.ruleS} strokeWidth="1" strokeDasharray={i === 0 || i === ticks ? "0" : "2 3"} />
            <text x={pad.l - 6} y={sy(v) + 3} fontSize="9" fill={C.ink3} textAnchor="end">{Math.round(v).toLocaleString()}</text>
          </g>
        );
      })}
      {data.length > 6 && [0, 6, 12, 18].map((hr) => {
        const idx = data.findIndex((d) => Math.abs(d.hour - hr) < 0.2);
        if (idx < 0) return null;
        return (
          <text key={hr} x={sx(data[idx][xKey])} y={h - 6} fontSize="9" fill={C.ink3} textAnchor="middle">{String(hr).padStart(2, "0")}:00</text>
        );
      })}
      {yKeys.map((k) => {
        const pts = data.map((d) => `${sx(d[xKey]).toFixed(1)},${sy(d[k.key]).toFixed(1)}`).join(" ");
        return (
          <g key={k.key}>
            {k.fill && (
              <polygon points={`${sx(xmin)},${sy(ymin)} ${pts} ${sx(xmax)},${sy(ymin)}`} fill={k.fill} />
            )}
            <polyline points={pts} fill="none" stroke={k.stroke || C.ink} strokeWidth={k.strokeWidth || 1.2} strokeDasharray={k.dash || "0"} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── shell ──────────────────────────────────────────────────────────
const SCREENS_C = [
  { id: "dash",    label: "monitor",       k: "F1" },
  { id: "predict", label: "predict",       k: "F2" },
  { id: "reco",    label: "optimize",      k: "F3" },
  { id: "anom",    label: "anomalies",     k: "F4" },
  { id: "hist",    label: "history",       k: "F5" },
  { id: "drill",   label: "machines",      k: "F6" },
  { id: "train",   label: "model",         k: "F7" },
  { id: "ingest",  label: "ingest · db",   k: "F8" },
  { id: "set",     label: "settings",      k: "F9" },
];

function CShell({ active, setActive, children }) {
  const [now, setNow] = useStateC(new Date());
  useEffectC(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const fmt = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div style={{ width: 1440, height: 900, background: C.bg, color: C.ink, fontFamily: C.mono,
      fontSize: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.rule}`, padding: "0 16px", height: 36, gap: 18, background: C.panel }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 11, color: C.amber, letterSpacing: 1 }}>◆ ASTEROPE</span>
          <span style={{ fontSize: 10, color: C.ink3 }}>energy-opt v2.6.1 // gomati-mill // shift-2</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10.5, color: C.ink2, display: "flex", gap: 18 }}>
          <span><span style={{ color: C.ok }}>●</span> shift B · 14:00–22:00</span>
          <span><span style={{ color: C.ok }}>●</span> model:v2026.05.21-3</span>
          <span><span style={{ color: C.ok }}>●</span> plc:live</span>
          <span><span style={{ color: C.amber }}>●</span> xlsx:enabled</span>
          <span><span style={{ color: C.ok }}>●</span> db:local</span>
          <span>2026-05-24 {fmt} IST</span>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.rule}`, background: C.panel, height: 34 }}>
        {SCREENS_C.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            style={{ border: 0, background: active === s.id ? C.bg : "transparent",
              borderRight: `1px solid ${C.rule}`,
              borderTop: active === s.id ? `1px solid ${C.amber}` : `1px solid transparent`,
              borderBottom: active === s.id ? "none" : `0`,
              color: active === s.id ? C.ink : C.ink2,
              padding: "0 16px", fontFamily: C.mono, fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: active === s.id ? -1 : 0,
            }}>
            <span style={{ color: C.ink3 }}>{s.k}</span>
            <span>{s.label}</span>
          </button>
        ))}
        <div style={{ flex: 1, borderBottom: `1px solid ${C.rule}` }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>

      {/* Status bar */}
      <div style={{ display: "flex", borderTop: `1px solid ${C.rule}`, padding: "0 16px", height: 22, alignItems: "center",
        background: C.panel, fontSize: 10, color: C.ink3, gap: 24 }}>
        <span>cpu 21%</span>
        <span>mem 4.1G / 8G</span>
        <span>plc.runtime: 182 401 rows/24h</span>
        <span>plc.energy: 182 401 rows/24h</span>
        <span>lag 240ms</span>
        <span style={{ marginLeft: "auto", color: C.ink2 }}>↑/↓ navigate · ⏎ open · q quit</span>
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────
const Panel = ({ title, right, children, style, pad = 14 }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.rule}`, display: "flex", flexDirection: "column", overflow: "hidden", ...style }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 12px", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, letterSpacing: 0.6, textTransform: "uppercase", background: C.panel2 }}>
      <span>{title}</span>
      <span style={{ color: C.ink2, textTransform: "none", letterSpacing: 0 }}>{right}</span>
    </div>
    <div style={{ padding: pad, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Kv = ({ k, v, vColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11.5 }}>
    <span style={{ color: C.ink3 }}>{k}</span>
    <span style={{ color: vColor || C.ink }}>{v}</span>
  </div>
);

const Big = ({ v, u, c }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
    <span style={{ fontSize: 28, color: c || C.ink, letterSpacing: -0.5 }}>{v}</span>
    {u && <span style={{ fontSize: 11, color: C.ink3 }}>{u}</span>}
  </div>
);

// ─── screens ────────────────────────────────────────────────────────
function CDash({ tick }) {
  const series = DC.PLANT_SERIES;
  const i = 58;
  const current = series[i].actual;
  const predicted = series[i].predicted;
  const dt = current - predicted;

  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: "auto 1fr auto", gap: 10, overflow: "hidden" }}>
      <Panel title="01 / live load" right="kW · live">
        <Big v={current.toLocaleString()} u="kW" c={dt > 0 ? C.warn : C.ok} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          pred {predicted.toLocaleString()} · Δ {dt > 0 ? "+" : ""}{dt.toFixed(0)}kW ({((dt/predicted)*100).toFixed(1)}%)
        </div>
      </Panel>
      <Panel title="02 / current shift · B" right="14:00 → 22:00">
        <Big v={(series.slice(56, i).reduce((s,p)=>s+p.actual/4,0)/1000).toFixed(2)} u={`MWh · ${((i-56)/4).toFixed(1)}h / 8h`} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          shift fcst 21.8 MWh · target 21.4 · source: plc-live
        </div>
      </Panel>
      <Panel title="03 / fleet">
        <Big v={DC.MACHINES.filter(m=>m.status==='running').length} u={`/ ${DC.MACHINES.length}`} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          {DC.MACHINES.filter(m=>m.status==='doff').length} doff · {DC.MACHINES.filter(m=>m.status==='idle').length} idle · {DC.MACHINES.filter(m=>m.status==='fault').length} fault
        </div>
      </Panel>
      <Panel title="04 / alerts">
        <Big v={DC.ANOMALIES.filter(a=>a.status==='open').length} u="open" c={C.warn} />
        <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
          {DC.ANOMALIES.filter(a=>a.status==='ack').length} ack · {DC.ANOMALIES.filter(a=>a.status==='resolved').length} resolved
        </div>
      </Panel>

      <Panel title="plant load · pred vs actual · 24h" right="MAPE 3.41%" style={{ gridColumn: "span 3" }}>
        <div style={{ flex: 1 }}>
          <CLineChart w={1010} h={360} data={series} xKey="t"
            yKeys={[
              { key: "predicted", stroke: C.ink3, strokeWidth: 1, dash: "2 3" },
              { key: "actual",    stroke: C.amber, strokeWidth: 1.4, fill: "rgba(201,138,58,0.07)" },
            ]} />
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          <span>━━ actual</span><span>· · · predicted</span>
          <span style={{ marginLeft: "auto", color: C.ink2 }}>14:30 cursor · {current.toLocaleString()}kW · pred {predicted.toLocaleString()}kW · res +{dt.toFixed(0)}kW (1.8σ)</span>
        </div>
      </Panel>

      <Panel title="fleet grid · 64 mach" right="hover for detail">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
          {DC.MACHINES.map((m) => {
            const colors = { running: C.amber, idle: C.ink4, doff: C.ink3, fault: C.warn, maint: C.ink3 };
            return <div key={m.id} title={`${m.id} ${m.status} ${m.kw}kW`}
              style={{ aspectRatio: "1.2", background: colors[m.status], opacity: m.status === "running" ? 0.5 + m.efficiency * 0.5 : 1 }} />;
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 9.5, color: C.ink3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <span>■ run·{DC.MACHINES.filter(m=>m.status==='running').length}</span>
          <span>■ doff·{DC.MACHINES.filter(m=>m.status==='doff').length}</span>
          <span>■ idle·{DC.MACHINES.filter(m=>m.status==='idle').length}</span>
          <span style={{ color: C.warn }}>■ fault·{DC.MACHINES.filter(m=>m.status==='fault').length}</span>
        </div>
      </Panel>

      <Panel title="recent events · log tail" style={{ gridColumn: "span 2" }}>
        <div style={{ fontSize: 10.5, lineHeight: 1.6, color: C.ink2, fontFamily: C.mono }}>
          {DC.ANOMALIES.slice(0, 7).map((a) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "50px 70px 60px 1fr", gap: 8 }}>
              <span style={{ color: C.ink3 }}>{a.time}</span>
              <span style={{ color: C.ink }}>{a.machine}</span>
              <span style={{ color: a.severity === "high" ? C.warn : a.severity === "med" ? C.amber : C.ink3 }}>[{a.severity}]</span>
              <span style={{ color: C.ink2 }}>{a.kind}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="top reco · queued" right="3 of 6">
        <div style={{ fontSize: 10.5, lineHeight: 1.5 }}>
          {DC.RECOMMENDATIONS.slice(0,3).map((r) => (
            <div key={r.id} style={{ padding: "4px 0", borderBottom: `1px solid ${C.ruleS}` }}>
              <div style={{ color: C.amber }}>{r.id} · −{r.savings_kwh} kWh</div>
              <div style={{ color: C.ink2, fontSize: 10 }}>{r.title.slice(0, 32)}…</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="hourly demand · last 24h">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 50 }}>
          {Array.from({ length: 24 }, (_, h) => {
            const idx = series.findIndex(d => Math.abs(d.hour - h) < 0.2);
            if (idx < 0) return null;
            const v = series[idx].actual;
            const max = 6800;
            return <div key={h} style={{ width: 12, height: `${(v/max)*100}%`, background: C.amber, opacity: 0.7 }} />;
          })}
        </div>
        <div style={{ fontSize: 9.5, color: C.ink3, marginTop: 4 }}>peak 6.41 MW · trough 3.92 MW · spread 2.49 MW</div>
      </Panel>
    </div>
  );
}

function CPredict() {
  const shifts = DC.SHIFT_HISTORY;
  const [shiftLetter, setShiftLetter] = useStateC("B");
  const [machine, setMachine] = useStateC("TFO-014");
  const [runtime, setRuntime] = useStateC(7.4);
  const [rpm, setRpm] = useStateC(9400);
  const [spindles, setSpindles] = useStateC(144);
  const [denier, setDenier] = useStateC(295);

  const shiftFactor = { A: 1.00, B: 1.02, C: 0.94 };
  const yarnFactor = denier < 240 ? 0.94 : denier < 320 ? 1.00 : 1.08;

  const predicted = useMemoC(() => {
    // Per-machine, per-shift kWh — includes spindle load + machine's share
    // of plant aux loads (HVAC, humidification, compressed air, lighting).
    // Calibrated so a typical 144-spindle TFO at 9400 RPM over 7.4h ≈ 640 kWh,
    // matching the per-shift / per-machine mean seen in shift_facts.
    return +(0.55 * spindles * runtime * Math.pow(rpm / 9000, 1.55) * shiftFactor[shiftLetter] * yarnFactor).toFixed(0);
  }, [shiftLetter, runtime, rpm, spindles, denier]);

  // Same machine, same shift letter, last 6 shifts (one per day)
  const recent = useMemoC(() => {
    const matching = shifts.filter(s => s.shift === shiftLetter && !s.partial).slice(-6);
    // Synthesize per-machine kWh by averaging plant / 64
    return matching.map(s => ({
      ...s,
      machine_kwh: Math.round(s.energy_kwh / 64 + (machine.charCodeAt(2) * 7 % 40) - 20),
    }));
  }, [shifts, shiftLetter, machine]);

  // Plant-wide per-shift bar series for the left chart
  const completed = shifts.filter(s => !s.partial);
  const max = Math.max(...completed.map(s => s.energy_kwh)) * 1.05;
  const shiftColors = { A: C.amber, B: C.ink2, C: C.ink3 };

  return (
    <div style={{ height: "100%", padding: 12, display: "grid",
      gridTemplateColumns: "1.7fr 1fr", gridTemplateRows: "1fr 0.85fr", gap: 10, overflow: "hidden" }}>

      <Panel title="predicted vs actual · per shift · last 41 shifts" right="model: GBT-180 · scope: plant" style={{ gridRow: "span 2" }}>
        <svg width={840} height={300} style={{ display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <line key={i} x1={50} x2={830} y1={20 + f * 230} y2={20 + f * 230} stroke={C.ruleS} strokeDasharray="2 3" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <text key={i} x={42} y={253 - f * 230} fontSize="9" fill={C.ink3} textAnchor="end">
              {Math.round((f * max) / 1000)}k
            </text>
          ))}
          {completed.map((s, i) => {
            const bw = 780 / completed.length;
            const x = 55 + i * bw;
            const h = (s.energy_kwh / max) * 230;
            // synthesize per-shift predicted value (close to actual + small noise)
            const noise = ((s.id.charCodeAt(8) * 7) % 100) - 50;
            const predicted_val = Math.max(0, s.energy_kwh + noise * 20);
            const ph = (predicted_val / max) * 230;
            return (
              <g key={s.id}>
                <rect x={x + 0.5} y={250 - h} width={bw - 1} height={h} fill={shiftColors[s.shift]} opacity={0.9} />
                <line x1={x + bw/2} x2={x + bw/2} y1={250 - ph - 3} y2={250 - ph + 3} stroke={C.ok} strokeWidth="1.5" />
                {i % 9 === 0 && (
                  <text x={x + bw / 2} y={266} fontSize="9" fill={C.ink3} textAnchor="middle">{s.dateLabel}·{s.shift}</text>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 16, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: shiftColors.A, marginRight: 4, verticalAlign: "middle" }} />A</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: shiftColors.B, marginRight: 4, verticalAlign: "middle" }} />B</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: shiftColors.C, marginRight: 4, verticalAlign: "middle" }} />C</span>
          <span><span style={{ display: "inline-block", width: 10, height: 2, background: C.ok, marginRight: 4, verticalAlign: "middle" }} />predicted (tick)</span>
        </div>

        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, padding: "10px 0", borderTop: `1px solid ${C.rule}` }}>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>mape · shift</div><div style={{ fontSize: 18 }}>3.41<span style={{ color: C.ink3, fontSize: 10 }}>%</span></div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>rmse · shift</div><div style={{ fontSize: 18 }}>218<span style={{ color: C.ink3, fontSize: 10 }}>kWh</span></div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>r²</div><div style={{ fontSize: 18 }}>0.974</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>drift</div><div style={{ fontSize: 18, color: C.ok }}>0.08<span style={{ color: C.ink3, fontSize: 10 }}>σ</span></div></div>
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 10, color: C.ink3, marginBottom: 4 }}>shift residuals · last 41 shifts</div>
          <svg width={840} height={50}>
            <line x1={50} x2={830} y1={25} y2={25} stroke={C.ink4} strokeDasharray="2 3" />
            {completed.map((s, idx) => {
              const noise = ((s.id.charCodeAt(8) * 11) % 100) - 50;
              const r = noise * 12;
              const yr = 25 - (r / 500) * 22;
              const x = 55 + idx * (780 / completed.length) + (780 / completed.length) / 2;
              return <line key={idx} x1={x} x2={x} y1={25} y2={yr}
                stroke={Math.abs(r) > 350 ? C.warn : C.amber} strokeWidth="1.5" />;
            })}
          </svg>
        </div>
      </Panel>

      <Panel title="what-if · per-shift predictor" right="GBT-180 · per machine">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>shift_letter</div>
            <div style={{ display: "flex", gap: 4 }}>
              {["A", "B", "C"].map(L => (
                <button key={L} onClick={() => setShiftLetter(L)}
                  style={{ flex: 1, background: shiftLetter === L ? C.amber : "transparent",
                    border: `1px solid ${shiftLetter === L ? C.amber : C.ink4}`,
                    color: shiftLetter === L ? C.bg : C.ink2,
                    padding: "5px 0", fontFamily: C.mono, fontSize: 11, cursor: "pointer" }}>
                  {L} · {L === "A" ? "06–14" : L === "B" ? "14–22" : "22–06"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>machine</div>
            <select value={machine} onChange={(e) => setMachine(e.target.value)}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.ink4}`,
                color: C.ink, padding: "5px 8px", fontFamily: C.mono, fontSize: 11 }}>
              {DC.MACHINES.slice(0, 16).map(m => <option key={m.id} value={m.id}>{m.id} · {m.yarn}</option>)}
            </select>
          </div>
          <CKnob label="runtime_in_shift (max 8h)" val={runtime} set={setRuntime} min={0} max={8} step={0.1} u="h" />
          <CKnob label="spindle_rpm_avg" val={rpm} set={setRpm} min={6000} max={13000} step={100} u="rpm" />
          <CKnob label="spindles_active" val={spindles} set={setSpindles} min={48} max={192} step={12} u="" />
          <CKnob label="yarn_denier" val={denier} set={setDenier} min={150} max={500} step={5} u="D" />
        </div>
        <div style={{ marginTop: 14, padding: "10px 12px", background: C.bg, border: `1px solid ${C.ruleS}` }}>
          <div style={{ fontSize: 10, color: C.ink3 }}>predicted_kwh · 1 shift · 1 machine</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 40, color: C.amber, lineHeight: 1.1 }}>{predicted}</span>
            <span style={{ fontSize: 11, color: C.ink3 }}>kWh / shift</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
            95% CI [{Math.round(predicted*0.94)}, {Math.round(predicted*1.06)}] · σ ±{Math.round(predicted*0.03)} kWh
          </div>
        </div>
      </Panel>

      <Panel title={`recent same-shift · machine ${machine} · ${shiftLetter}`} right="6 most recent">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px",
          padding: "3px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase" }}>
          <span>shift_id</span><span style={{ textAlign: "right" }}>kWh</span><span style={{ textAlign: "right" }}>h</span><span style={{ textAlign: "right" }}>src</span>
        </div>
        {recent.map(s => {
          const delta = predicted - s.machine_kwh;
          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px",
              padding: "4px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: "center" }}>
              <span style={{ color: C.ink2, fontSize: 10.5 }}>{s.id}</span>
              <span style={{ textAlign: "right", color: C.amber }}>{s.machine_kwh}</span>
              <span style={{ textAlign: "right", color: C.ink3 }}>{s.runtime_h}</span>
              <span style={{ textAlign: "right", color: s.source === "xlsx" ? C.ok : C.ink3, fontSize: 9.5 }}>{s.source.replace("plc-live","live")}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 8, padding: "6px 8px", background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 10.5, color: C.ink3, lineHeight: 1.7 }}>
          shift_factor = <span style={{ color: C.amber }}>{shiftFactor[shiftLetter].toFixed(2)}</span> ·
          yarn_factor = <span style={{ color: C.amber }}>{yarnFactor.toFixed(2)}</span><br/>
          predicted vs 6-shift mean: <span style={{ color: C.amber }}>
            {(() => {
              const mean = recent.reduce((s,r)=>s+r.machine_kwh,0)/recent.length;
              return ((predicted - mean) / mean * 100).toFixed(1);
            })()}%
          </span>
        </div>
      </Panel>
    </div>
  );
}

function CKnob({ label, val, set, min, max, step, u }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.ink3 }}>
        <span>{label}</span>
        <span style={{ color: C.amber }}>{val}{u}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e)=>set(+e.target.value)}
        style={{ width: "100%", appearance: "none", height: 2, background: C.ruleS, accentColor: C.amber, marginTop: 4 }} />
    </div>
  );
}

function CReco() {
  const [applied, setApplied] = useStateC({});
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1fr 280px", gap: 10, overflow: "hidden" }}>
      <Panel title="optimization queue · ranked by Δ kWh" right={`${DC.RECOMMENDATIONS.length} actions`}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 90px 70px 90px", padding: "6px 4px", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>id</span><span>type</span><span>action / scope</span><span style={{ textAlign: "right" }}>Δ kWh</span><span style={{ textAlign: "right" }}>conf</span><span></span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {DC.RECOMMENDATIONS.map((r) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 90px 70px 90px", padding: "10px 4px",
              borderBottom: `1px solid ${C.ruleS}`, fontSize: 11.5, alignItems: "center" }}>
              <span style={{ color: C.amber }}>{r.id}</span>
              <span style={{ color: C.ink2, fontSize: 10.5 }}>{r.category}</span>
              <div>
                <div style={{ color: C.ink }}>{r.title}</div>
                <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>{r.machine} · {r.horizon}</div>
              </div>
              <span style={{ textAlign: "right", color: C.amber }}>−{r.savings_kwh}</span>
              <span style={{ textAlign: "right", color: C.ink2 }}>{(r.confidence * 100).toFixed(0)}%</span>
              <button onClick={() => setApplied({ ...applied, [r.id]: !applied[r.id] })}
                style={{ background: applied[r.id] ? C.amber : "transparent", border: `1px solid ${C.amber}`,
                  color: applied[r.id] ? C.bg : C.amber, fontFamily: C.mono, fontSize: 10, padding: "5px 10px",
                  cursor: "pointer", letterSpacing: 0.4 }}>
                {applied[r.id] ? "✓ APPLIED" : "APPLY ⏎"}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Panel title="summary">
          <Kv k="actions_queued" v={DC.RECOMMENDATIONS.length} />
          <Kv k="actions_applied" v={Object.keys(applied).filter(k=>applied[k]).length} />
          <div style={{ borderTop: `1px solid ${C.ruleS}`, marginTop: 6, paddingTop: 6 }}>
            <Kv k="potential_kwh_mo" v="13 408" vColor={C.amber} />
            <Kv k="potential_inr_mo" v="₹ 91 174" vColor={C.amber} />
            <Kv k="potential_co2_t" v="11.0 t" />
          </div>
        </Panel>

        <Panel title="action breakdown">
          {["speed", "schedule", "idle", "cluster"].map(cat => {
            const items = DC.RECOMMENDATIONS.filter(r => r.category === cat);
            const sum = items.reduce((s, r) => s + r.savings_kwh, 0);
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span>{cat}</span><span style={{ color: C.amber }}>−{sum} kWh/d</span>
                </div>
                <div style={{ height: 4, background: C.ruleS, marginTop: 3 }}>
                  <div style={{ height: "100%", background: C.amber, width: `${Math.min(sum/700, 1)*100}%`, opacity: 0.7 }} />
                </div>
              </div>
            );
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
  );
}

function CAnom() {
  const [sel, setSel] = useStateC(DC.ANOMALIES[0]);
  const ser = useMemoC(() => DC.buildMachineSeries(sel.id.charCodeAt(2)), [sel]);
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, overflow: "hidden" }}>
      <Panel title="alerts · today" right={`${DC.ANOMALIES.length} total`}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 50px 80px 50px 1fr 70px", fontSize: 10, color: C.ink3, padding: "4px 0", borderBottom: `1px solid ${C.rule}`, textTransform: "uppercase" }}>
          <span>id</span><span>time</span><span>machine</span><span>sev</span><span>kind</span><span>status</span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {DC.ANOMALIES.map((a) => (
            <button key={a.id} onClick={() => setSel(a)}
              style={{ display: "grid", gridTemplateColumns: "60px 50px 80px 50px 1fr 70px",
                width: "100%", textAlign: "left", border: 0, background: sel.id === a.id ? C.panel2 : "transparent",
                padding: "7px 0", borderBottom: `1px solid ${C.ruleS}`,
                color: C.ink, fontFamily: C.mono, fontSize: 11, cursor: "pointer", alignItems: "center" }}>
              <span style={{ color: C.ink3 }}>{a.id}</span>
              <span style={{ color: C.ink3 }}>{a.time}</span>
              <span>{a.machine}</span>
              <span style={{ color: a.severity === "high" ? C.warn : a.severity === "med" ? C.amber : C.ink3 }}>[{a.severity}]</span>
              <span style={{ color: C.ink2 }}>{a.kind}</span>
              <span style={{ color: a.status === "open" ? C.warn : a.status === "ack" ? C.amber : C.ok, fontSize: 10 }}>
                {a.status}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Panel title={`inspect · ${sel.id}`} right={sel.machine}>
          <div style={{ fontSize: 14, color: C.ink, marginBottom: 6 }}>{sel.kind}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Kv k="severity" v={sel.severity.toUpperCase()} vColor={sel.severity === "high" ? C.warn : C.amber} />
            <Kv k="z-score" v="4.21σ" vColor={C.warn} />
            <Kv k="detected" v={sel.time} />
            <Kv k="status" v={sel.status.toUpperCase()} vColor={sel.status === "open" ? C.warn : C.ok} />
            <Kv k="baseline" v="9.2 kW" />
            <Kv k="observed" v="11.8 kW" vColor={C.warn} />
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: C.ink3 }}>kw · 24h trace</div>
          <CLineChart w={580} h={140} data={ser} xKey="t"
            yKeys={[{ key: "kw", stroke: C.amber, strokeWidth: 1.2, fill: "rgba(201,138,58,0.07)" }]}
            pad={{ t: 6, r: 10, b: 18, l: 36 }} />
          <div style={{ marginTop: 8, padding: "8px 10px", background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 11, color: C.ink2, lineHeight: 1.6 }}>
            <span style={{ color: C.amber, fontSize: 10 }}>// model says</span><br/>
            Power draw exceeded predicted band by 4.21σ for 18 min starting 14:14.<br/>
            Pattern matches bearing-wear signature from 6 prior incidents (Apr–May).<br/>
            recommend: inspection at next doff
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button style={{ flex: 1, background: C.amber, border: 0, color: C.bg, padding: "8px 10px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer", letterSpacing: 0.4 }}>ACK ⌘A</button>
            <button style={{ flex: 1, background: "transparent", border: `1px solid ${C.amber}`, color: C.amber, padding: "8px 10px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>OPEN WO ⌘W</button>
            <button style={{ flex: 1, background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2, padding: "8px 10px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>SILENCE 1h</button>
          </div>
        </Panel>

        <Panel title="anomaly density · 14d">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 40 }}>
            {DC.HISTORY.map((d, i) => (
              <div key={i} style={{ flex: 1, height: `${(d.anomalies/6)*100}%`, background: C.amber, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.ink3, marginTop: 4 }}>
            <span>{DC.HISTORY[0].label}</span><span>{DC.HISTORY[DC.HISTORY.length-1].label}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CHist() {
  const shifts = DC.SHIFT_HISTORY;
  const max = Math.max(...shifts.map(s => s.energy_kwh)) * 1.08;
  const colors = { A: C.amber, B: C.ink2, C: C.ink3 };
  const sourceColor = (src) => src === "xlsx" ? C.ok : src === "plc-live" ? C.amber : C.ink3;
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: "auto 1fr 1fr", gap: 10, overflow: "hidden" }}>
      <Panel title="42 shifts · 14d energy"><Big v={(shifts.reduce((s,d)=>s+d.energy_kwh,0)/1000).toFixed(0)} u="MWh" /></Panel>
      <Panel title="42 shifts · output"><Big v={(shifts.reduce((s,d)=>s+d.output_kg,0)/1000).toFixed(1)} u="t yarn" /></Panel>
      <Panel title="avg kwh/kg">
        <Big v={(shifts.filter(s=>s.kwh_per_kg).reduce((s,d)=>s+d.kwh_per_kg,0)/shifts.filter(s=>s.kwh_per_kg).length).toFixed(2)} u="" c={C.amber} />
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 4 }}>benchmark 1.55 · spec ≤ 1.70</div>
      </Panel>
      <Panel title="sources · 42 shifts">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 28 }}>
          {(() => {
            const plc = shifts.filter(s => s.source === "plc").length;
            const xlsx = shifts.filter(s => s.source === "xlsx").length;
            const live = shifts.filter(s => s.source === "plc-live").length;
            return (
              <>
                <div style={{ flex: plc, height: 14, background: C.ink3 }} title={`plc · ${plc}`} />
                <div style={{ flex: xlsx, height: 14, background: C.ok }} title={`xlsx · ${xlsx}`} />
                <div style={{ flex: live, height: 14, background: C.amber }} title={`live · ${live}`} />
              </>
            );
          })()}
        </div>
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span><span style={{ color: C.ink3 }}>■</span> plc {shifts.filter(s=>s.source==='plc').length}</span>
          <span><span style={{ color: C.ok }}>■</span> xlsx {shifts.filter(s=>s.source==='xlsx').length}</span>
          <span><span style={{ color: C.amber }}>■</span> live {shifts.filter(s=>s.source==='plc-live').length}</span>
        </div>
      </Panel>

      <Panel title="shift_facts · energy_kwh per shift" right="42 shifts · A·B·C stacked · partial = striped" style={{ gridColumn: "span 4" }}>
        <svg width={1380} height={240} style={{ display: "block" }}>
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
            const bw = 1300 / shifts.length;
            const x = 55 + i * bw;
            const h = (s.energy_kwh / max) * 180;
            return (
              <g key={s.id}>
                <rect x={x + 0.5} y={200 - h} width={bw - 1} height={h}
                  fill={s.partial ? "url(#partial-stripe)" : colors[s.shift]}
                  opacity={s.partial ? 1 : 0.9} />
                <rect x={x + 0.5} y={216} width={bw - 1} height={3} fill={sourceColor(s.source)} />
                {i % 3 === 1 && (
                  <text x={x + bw / 2} y={232} fontSize="9.5" fill={C.ink3} textAnchor="middle">{s.dateLabel}</text>
                )}
              </g>
            );
          })}
          <text x={1374} y={232} fontSize="9" fill={C.ink3} textAnchor="end">source bar ↑</text>
        </svg>
        <div style={{ display: "flex", gap: 18, fontSize: 10, color: C.ink3, marginTop: 4 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: colors.A, marginRight: 4, verticalAlign: "middle" }} />shift A · 06–14</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: colors.B, marginRight: 4, verticalAlign: "middle" }} />shift B · 14–22</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: colors.C, marginRight: 4, verticalAlign: "middle" }} />shift C · 22–06</span>
          <span style={{ marginLeft: "auto", color: C.ink2 }}>cursor on a bar to view shift_id · runtime · source</span>
        </div>
      </Panel>

      <Panel title="kwh/kg per shift · benchmark 1.55" style={{ gridColumn: "span 2" }}>
        <svg width={680} height={150}>
          <line x1={30} x2={670} y1={70} y2={70} stroke={C.warn} strokeDasharray="3 3" strokeWidth="0.8" />
          <text x={672} y={73} fontSize="9" fill={C.warn} textAnchor="start">1.55</text>
          {shifts.filter(s => s.kwh_per_kg).map((s, i, arr) => {
            const x = 30 + i * (620 / arr.length) + 10;
            const y = 130 - ((s.kwh_per_kg - 1.2) / 1.2) * 100;
            return (
              <g key={s.id}>
                {i > 0 && (() => {
                  const prev = arr[i - 1];
                  const px = 30 + (i - 1) * (620 / arr.length) + 10;
                  const py = 130 - ((prev.kwh_per_kg - 1.2) / 1.2) * 100;
                  return <line x1={px} y1={py} x2={x} y2={y} stroke={C.amber} strokeWidth="0.8" opacity="0.7" />;
                })()}
                <circle cx={x} cy={y} r="2" fill={colors[s.shift]} />
              </g>
            );
          })}
        </svg>
        <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>colored by shift letter · 41 completed shifts</div>
      </Panel>

      <Panel title="recent shifts · table" style={{ gridColumn: "span 2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 30px 60px 60px 60px 60px 60px",
          padding: "4px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase" }}>
          <span>shift_id</span><span>s</span><span style={{ textAlign: "right" }}>kWh</span><span style={{ textAlign: "right" }}>h</span><span style={{ textAlign: "right" }}>kg</span><span style={{ textAlign: "right" }}>kWh/kg</span><span>src</span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {shifts.slice().reverse().slice(0, 14).map(s => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 30px 60px 60px 60px 60px 60px",
              padding: "5px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: "center" }}>
              <span style={{ color: C.ink2, fontSize: 10.5 }}>{s.id}{s.partial && <span style={{ color: C.amber }}> ·live</span>}</span>
              <span style={{ color: colors[s.shift] }}>{s.shift}</span>
              <span style={{ textAlign: "right", color: C.amber }}>{s.energy_kwh.toLocaleString()}</span>
              <span style={{ textAlign: "right", color: C.ink2 }}>{s.runtime_h}</span>
              <span style={{ textAlign: "right", color: C.ink2 }}>{s.output_kg.toLocaleString()}</span>
              <span style={{ textAlign: "right", color: C.ink2 }}>{s.kwh_per_kg || "—"}</span>
              <span style={{ color: sourceColor(s.source), fontSize: 10 }}>[{s.source}]</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CDrill() {
  const [sel, setSel] = useStateC("TFO-027");
  const m = DC.MACHINES.find(x => x.id === sel) || DC.MACHINES[0];
  const series = useMemoC(() => DC.buildMachineSeries(m.id.charCodeAt(2) * 3), [m.id]);
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "240px 1fr", gap: 10, overflow: "hidden" }}>
      <Panel title="fleet · 64 machines" right="line A·B·C·D">
        <div style={{ overflow: "auto", flex: 1, marginRight: -4, paddingRight: 4 }}>
          {DC.MACHINES.map((x) => {
            const cols = { running: C.amber, idle: C.ink3, doff: C.ink2, fault: C.warn, maint: C.ink3 };
            return (
              <button key={x.id} onClick={() => setSel(x.id)}
                style={{ display: "grid", gridTemplateColumns: "8px 60px 1fr 50px", gap: 6,
                  width: "100%", border: 0, padding: "5px 4px", textAlign: "left",
                  background: sel === x.id ? C.panel2 : "transparent",
                  color: sel === x.id ? C.ink : C.ink2,
                  fontFamily: C.mono, fontSize: 11, cursor: "pointer", alignItems: "center" }}>
                <span style={{ width: 6, height: 6, background: cols[x.status], borderRadius: 1, display: "inline-block" }} />
                <span>{x.id}</span>
                <span style={{ color: C.ink3, fontSize: 10 }}>L{x.line}·{x.cluster}</span>
                <span style={{ textAlign: "right", color: C.amber }}>{x.kw.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr 1fr", gap: 10, overflow: "hidden" }}>
        <Panel title={`${m.id} · line ${m.line} · cluster ${m.cluster}`} right={`status: ${m.status}`} style={{ gridColumn: "span 2" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>load</div><div style={{ fontSize: 22, color: C.amber }}>{m.kw.toFixed(1)}<span style={{ fontSize: 10, color: C.ink3 }}>kW</span></div></div>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>kwh_24h</div><div style={{ fontSize: 22 }}>{m.kwh24}</div></div>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>runtime</div><div style={{ fontSize: 22 }}>{m.runtime24.toFixed(1)}<span style={{ fontSize: 10, color: C.ink3 }}>h</span></div></div>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>eff</div><div style={{ fontSize: 22 }}>{(m.efficiency*100).toFixed(0)}<span style={{ fontSize: 10, color: C.ink3 }}>%</span></div></div>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>kwh/kg</div><div style={{ fontSize: 22 }}>{m.kwhPerKg}</div></div>
            <div><div style={{ fontSize: 10, color: C.ink3 }}>doffs_24h</div><div style={{ fontSize: 22 }}>{m.doffsToday}</div></div>
          </div>
        </Panel>

        <Panel title="kw · 24h" right="1-min resolution" style={{ gridColumn: "span 2" }}>
          <CLineChart w={1140} h={160} data={series} xKey="t"
            yKeys={[{ key: "kw", stroke: C.amber, strokeWidth: 1.3, fill: "rgba(201,138,58,0.06)" }]}
            pad={{ t: 8, r: 12, b: 18, l: 38 }} />
        </Panel>

        <Panel title="process params">
          <table style={{ width: "100%", fontSize: 11.5, color: C.ink }}>
            <tbody>
              {[["yarn", m.yarn],["denier", m.denier+"D"],["ply", m.ply],["spindles", m.spindles],["spindle_rpm", m.rpm.toLocaleString()],["twist_multiplier", m.twistMultiplier],["tpi", m.tpi],["commissioned", m.commissioned]].map(([k, v]) => (
                <tr key={k}><td style={{ color: C.ink3, padding: "3px 0" }}>{k}</td><td style={{ textAlign: "right" }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="feature attribution · why this kwh">
          {DC.FEATURES.slice(0, 8).map(f => (
            <div key={f.name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 40px", alignItems: "center", padding: "2.5px 0", fontSize: 11 }}>
              <span style={{ color: C.ink2 }}>{f.name}</span>
              <div style={{ height: 4, background: C.ruleS }}>
                <div style={{ height: "100%", width: `${(f.importance/0.31)*100}%`, background: C.amber, opacity: 0.85 }} />
              </div>
              <span style={{ color: C.ink3, textAlign: "right" }}>{(f.importance*100).toFixed(0)}%</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function CTrain() {
  const [training, setT] = useStateC(false);
  const [progress, setP] = useStateC(0);
  useEffectC(() => {
    if (!training) return;
    const t = setInterval(() => setP(p => p >= 100 ? (setT(false), 100) : p + 2), 80);
    return () => clearInterval(t);
  }, [training]);
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1.3fr 1fr", gridTemplateRows: "auto 1fr", gap: 10, overflow: "hidden" }}>
      <Panel title="model_runs · data-source audit trail" right="4 versions" style={{ gridColumn: "span 2" }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 120px 60px 70px 1fr 90px 150px 90px",
          padding: "4px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase", gap: 10 }}>
          <span>id</span><span>trained</span><span>mape</span><span>rmse</span><span>params · window</span><span style={{ textAlign: "right" }}>rows</span><span>source mix · plc / xlsx / manual</span><span>status</span>
        </div>
        {DC.MODEL_RUNS.map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "160px 120px 60px 70px 1fr 90px 150px 90px",
            padding: "10px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11.5, alignItems: "center", gap: 10 }}>
            <span style={{ color: C.amber }}>{r.id}</span>
            <div style={{ fontSize: 10.5 }}>
              <div style={{ color: C.ink2 }}>{r.date}</div>
              <div style={{ color: C.ink3, fontSize: 9.5, marginTop: 1 }}>{r.training_window}</div>
            </div>
            <span>{r.mape}%</span>
            <span>{r.rmse}<span style={{ color: C.ink3, fontSize: 10 }}> kWh</span></span>
            <div style={{ fontSize: 10.5 }}>
              <div style={{ color: C.ink2 }}>{r.params}</div>
              <div style={{ color: C.ink3, fontSize: 9.5, marginTop: 1 }}>uploads: {r.uploads.join(", ")}</div>
            </div>
            <span style={{ textAlign: "right", color: C.ink3 }}>{(r.rows/1e6).toFixed(2)}M</span>
            <div>
              <div style={{ display: "flex", height: 10, border: `1px solid ${C.ruleS}` }}>
                <div style={{ width: `${r.sources.plc*100}%`, background: C.ink3 }} title={`plc ${(r.sources.plc*100).toFixed(0)}%`} />
                <div style={{ width: `${r.sources.xlsx*100}%`, background: C.ok }} title={`xlsx ${(r.sources.xlsx*100).toFixed(0)}%`} />
                <div style={{ width: `${r.sources.manual*100}%`, background: C.amber }} title={`manual ${(r.sources.manual*100).toFixed(0)}%`} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.ink3, marginTop: 3 }}>
                <span>{(r.sources.plc*100).toFixed(0)}%</span>
                <span style={{ color: C.ok }}>{(r.sources.xlsx*100).toFixed(0)}%</span>
                <span style={{ color: C.amber }}>{(r.sources.manual*100).toFixed(0)}%</span>
              </div>
            </div>
            <span style={{ color: r.status === "deployed" ? C.ok : C.ink3, fontSize: 10, textTransform: "uppercase" }}>
              [{r.status}]
            </span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: C.ink3, display: "flex", gap: 14 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: C.ink3, marginRight: 4, verticalAlign: "middle" }} />plc · live tags</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: C.ok, marginRight: 4, verticalAlign: "middle" }} />xlsx · operator upload</span>
          <span><span style={{ display: "inline-block", width: 10, height: 8, background: C.amber, marginRight: 4, verticalAlign: "middle" }} />manual · console-edited</span>
          <span style={{ marginLeft: "auto", color: C.ink2 }}>full lineage in <span style={{ color: C.amber }}>uploads</span> + <span style={{ color: C.amber }}>model_runs.lineage</span></span>
        </div>
      </Panel>

      <Panel title="feature_importance · v2026.05.21-3">
        {DC.FEATURES.map(f => (
          <div key={f.name} style={{ display: "grid", gridTemplateColumns: "170px 1fr 40px", alignItems: "center", padding: "4px 0", fontSize: 11 }}>
            <span style={{ color: C.ink2 }}>{f.name}</span>
            <div style={{ height: 5, background: C.ruleS }}>
              <div style={{ height: "100%", width: `${(f.importance/0.31)*100}%`, background: C.amber, opacity: 0.9 }} />
            </div>
            <span style={{ color: C.ink3, textAlign: "right" }}>{(f.importance*100).toFixed(0)}%</span>
          </div>
        ))}
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Panel title="data_ingestion · last 24h">
          {[["plc.runtime","182 401","2m","ok"],["plc.energy_meter","182 401","2m","ok"],["mes.production","1 204","9m","ok"],["ambient.weather_api","96","14m","ok"],["maint.work_orders","31","1h","stale"]].map(([s, r, t, st]) => (
            <div key={s} style={{ display: "grid", gridTemplateColumns: "1fr 80px 50px 60px", padding: "5px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
              <span style={{ color: C.ink2 }}>{s}</span>
              <span style={{ color: C.ink3, textAlign: "right" }}>{r}</span>
              <span style={{ color: C.ink3, textAlign: "right" }}>{t}</span>
              <span style={{ color: st === "ok" ? C.ok : C.warn, textAlign: "right", fontSize: 10 }}>[{st}]</span>
            </div>
          ))}
        </Panel>

        <Panel title="retrain · pipeline">
          <div style={{ fontSize: 11, color: C.ink2, marginBottom: 10, lineHeight: 1.5 }}>
            $ asterope retrain --days 30 --rows 4.21M --gpu node-02
          </div>
          {training || progress > 0 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.ink3, marginBottom: 4 }}>
                <span>{progress < 30 ? "fetch_data" : progress < 60 ? "feature_eng" : progress < 95 ? "fit_trees" : "validate"}…</span>
                <span style={{ color: C.amber }}>{progress}%</span>
              </div>
              <div style={{ height: 5, background: C.ruleS }}>
                <div style={{ height: "100%", width: `${progress}%`, background: C.amber, transition: "width 0.2s" }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: C.ink3, fontFamily: C.mono, lineHeight: 1.6 }}>
                {progress >= 10 && <div>{"> connected to feature_store"}</div>}
                {progress >= 30 && <div>{"> 4 213 887 rows fetched · 312 cols"}</div>}
                {progress >= 50 && <div>{"> engineered 24 derived features"}</div>}
                {progress >= 70 && <div>{"> fitting 180 estimators ·  ETA 2m11s"}</div>}
                {progress >= 95 && <div>{"> holdout mape: 3.28% (-0.13 vs current)"}</div>}
              </div>
            </div>
          ) : (
            <button onClick={() => { setP(0); setT(true); }}
              style={{ background: C.amber, border: 0, color: C.bg, padding: "8px 16px",
                fontFamily: C.mono, fontSize: 10.5, letterSpacing: 0.5, cursor: "pointer" }}>
              ▶ RUN RETRAIN
            </button>
          )}
        </Panel>

        <Panel title="cluster_map">
          {DC.CLUSTERS.map(c => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "16px 1fr 50px 70px", gap: 8, padding: "3px 0", fontSize: 11.5, alignItems: "center" }}>
              <span style={{ color: C.amber }}>{c.id}</span>
              <span style={{ color: C.ink2 }}>{c.label}</span>
              <span style={{ color: C.ink3, textAlign: "right" }}>n={c.count}</span>
              <span style={{ textAlign: "right" }}>{c.kwhPerKg}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ─── Ingest · Excel upload + PLC live + local DB ────────────────────
function CIngest() {
  const [mode, setMode] = useStateC("hybrid"); // plc | xlsx | hybrid
  const [stage, setStage] = useStateC("idle"); // idle | parsing | preview | committing | committed | backfill-parsing | backfill-review | backfill-committing | backfill-committed
  const [file, setFile] = useStateC(null);
  const [progress, setProgress] = useStateC(0);
  const [dragOver, setDragOver] = useStateC(false);
  const [log, setLog] = useStateC(DC.UPLOAD_LOG);
  const [grid, setGrid] = useStateC(DC.BACKFILL.grid);

  const rows = DC.SAMPLE_PARSED_ROWS;
  const stats = useMemoC(() => {
    const ok = rows.filter(r => r._status === "ok").length;
    const warn = rows.filter(r => r._status === "warn").length;
    const err = rows.filter(r => r._status === "err").length;
    return { total: rows.length, ok, warn, err };
  }, [rows]);

  const gridStats = useMemoC(() => {
    const t = (s) => grid.filter(g => g.status === s).length;
    const r = (s) => grid.filter(g => g.resolution === s).length;
    const rowsToWrite = grid.reduce((s, g) => {
      if (g.resolution === "skip") return s;
      if (g.resolution === "insert") return s + g.rows_in_file;
      if (g.resolution === "overwrite") return s + g.rows_in_file;
      if (g.resolution === "merge") return s + Math.max(0, g.rows_in_file - g.rows_in_db);
      return s;
    }, 0);
    return {
      new: t("new"), confPlc: t("conflict-plc"), confXlsx: t("conflict-xlsx"), partial: t("partial"),
      skip: r("skip"), insert: r("insert"), overwrite: r("overwrite"), merge: r("merge"),
      rowsToWrite,
    };
  }, [grid]);

  function pickFile(f) {
    if (!f) return;
    setFile({ name: f.name || "shift_2026-05-23.xlsx", size: f.size || 38_412, type: f.type });
    setStage("parsing");
    setProgress(0);
  }

  function loadBackfill() {
    setFile({ name: DC.BACKFILL_META.file, size: DC.BACKFILL_META.size_kb * 1024 });
    setStage("backfill-parsing");
    setProgress(0);
  }

  useEffectC(() => {
    if (stage !== "parsing") return;
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { setStage("preview"); return 100; }
      return p + 8;
    }), 60);
    return () => clearInterval(t);
  }, [stage]);

  useEffectC(() => {
    if (stage !== "backfill-parsing") return;
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { setStage("backfill-review"); return 100; }
      return p + 5;
    }), 50);
    return () => clearInterval(t);
  }, [stage]);

  useEffectC(() => {
    if (stage !== "committing") return;
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) {
        setStage("committed");
        setLog((prev) => [{
          id: `UP-${(241 + prev.filter(x=>x.status==="committed").length).toString()}`,
          file: file?.name || "shift_2026-05-23.xlsx",
          rows: rows.length - stats.err,
          date: "now",
          user: "n.agarwal",
          status: "committed",
          warnings: stats.warn,
        }, ...prev]);
        return 100;
      }
      return p + 10;
    }), 60);
    return () => clearInterval(t);
  }, [stage]);

  useEffectC(() => {
    if (stage !== "backfill-committing") return;
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) {
        setStage("backfill-committed");
        setLog((prev) => [{
          id: `UP-${(242 + prev.filter(x=>x.status==="committed").length).toString()}`,
          file: file?.name || "backfill_may_w2.xlsx",
          rows: gridStats.rowsToWrite,
          date: "now",
          user: "n.agarwal",
          status: "committed",
          warnings: gridStats.partial,
        }, ...prev]);
        return 100;
      }
      return p + 6;
    }), 60);
    return () => clearInterval(t);
  }, [stage]);

  function reset() {
    setStage("idle"); setFile(null); setProgress(0);
    setGrid(DC.BACKFILL.grid);
  }

  function setResolutionAll(res) {
    setGrid(grid.map(g => g.status === "new" ? g : { ...g, resolution: res }));
  }
  function setOneResolution(id, res) {
    setGrid(grid.map(g => g.id === id ? { ...g, resolution: res } : g));
  }

  // ── Full-screen backfill review takeover ─────────────────────────
  if (stage === "backfill-parsing" || stage === "backfill-review" || stage === "backfill-committing" || stage === "backfill-committed") {
    return <CBackfill {...{ stage, progress, file, grid, gridStats, setOneResolution, setResolutionAll, setStage, setProgress, reset }} />;
  }

  return (
    <div style={{ height: "100%", padding: 12, display: "grid",
      gridTemplateColumns: "1.1fr 1.4fr 1fr",
      gridTemplateRows: "auto 1fr auto", gap: 10, overflow: "hidden" }}>

      {/* Source mode */}
      <Panel title="data_source · mode">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "plc", label: "plc · live only", sub: "1-min PLC snapshots aggregated to shift", k: "1" },
            { id: "xlsx", label: "xlsx · upload only", sub: "operator-keyed Excel after each shift", k: "2" },
            { id: "hybrid", label: "hybrid · plc + xlsx fallback", sub: "auto-switch when PLC gap > 15 min", k: "3" },
          ].map(o => (
            <button key={o.id} onClick={() => setMode(o.id)}
              style={{ border: `1px solid ${mode === o.id ? C.amber : C.rule}`,
                background: mode === o.id ? C.panel2 : "transparent",
                color: C.ink, padding: "8px 10px", textAlign: "left",
                fontFamily: C.mono, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: mode === o.id ? C.amber : C.ink, fontSize: 11.5 }}>
                  {mode === o.id ? "●" : "○"} {o.label}
                </span>
                <span style={{ color: C.ink3, fontSize: 10 }}>[{o.k}]</span>
              </div>
              <div style={{ color: C.ink3, fontSize: 10, marginTop: 3 }}>{o.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "8px 10px", background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 10.5, color: C.ink3, lineHeight: 1.6 }}>
          smallest_window = shift (8h)<br/>
          shift_A 06:00–14:00 · B 14:00–22:00 · C 22:00–06:00<br/>
          aggregation: sum(energy_kwh), sum(runtime_h), avg(rpm)
        </div>
      </Panel>

      {/* Upload / drop zone */}
      <Panel title="excel_upload · drag & drop" right=".xlsx / .xls / .csv · ≤ 20 MB">
        {stage === "idle" && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
            style={{ flex: 1, border: `1.5px dashed ${dragOver ? C.amber : C.ink4}`,
              background: dragOver ? "rgba(201,138,58,0.06)" : C.bg,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 30, textAlign: "center", minHeight: 160 }}>
            <div style={{ fontSize: 28, color: dragOver ? C.amber : C.ink3 }}>⤓</div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.ink2 }}>
              drop <span style={{ color: C.amber }}>shift_YYYY-MM-DD.xlsx</span> here
            </div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: C.ink3 }}>or click to browse · max 20 MB · sheet named "shift_facts"</div>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files[0])} />
            <div style={{ marginTop: 14, fontSize: 10.5, color: C.ink3 }}>
              templates: <span style={{ color: C.amber, textDecoration: "underline" }}>shift_template.xlsx</span>
              {" · "}
              <span style={{ color: C.amber, textDecoration: "underline" }}>backfill_template.xlsx</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button onClick={(e) => { e.preventDefault(); pickFile({ name: "shift_2026-05-23.xlsx", size: 38412 }); }}
                style={{ background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2,
                  padding: "6px 12px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>
                ▶ demo: single shift
              </button>
              <button onClick={(e) => { e.preventDefault(); loadBackfill(); }}
                style={{ background: "transparent", border: `1px solid ${C.amber}`, color: C.amber,
                  padding: "6px 12px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>
                ▶ demo: backfill 7 days
              </button>
            </div>
          </label>
        )}

        {stage === "parsing" && (
          <div style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.ink }}>{file?.name}</div>
            <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 2 }}>{(file?.size/1024).toFixed(1)} KB · parsing…</div>
            <div style={{ height: 5, background: C.ruleS, marginTop: 14 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: C.amber, transition: "width 0.1s" }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: C.ink3, lineHeight: 1.7 }}>
              {progress >= 10 && <div>{"> opening workbook · 1 sheet found"}</div>}
              {progress >= 30 && <div>{"> sheet \"shift_facts\" · 192 rows × 9 cols"}</div>}
              {progress >= 50 && <div>{"> validating schema against UPLOAD_SCHEMA v3"}</div>}
              {progress >= 70 && <div>{"> running pre-commit anomaly check"}</div>}
              {progress >= 90 && <div style={{ color: C.amber }}>{"> 2 warnings · 1 error · ready for review"}</div>}
            </div>
          </div>
        )}

        {stage === "preview" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: C.ink }}>{file?.name}</span>
                <span style={{ color: C.ink3, marginLeft: 10 }}>{stats.total} rows · {stats.ok} ok · </span>
                <span style={{ color: C.amber }}>{stats.warn} warn</span>
                <span style={{ color: C.ink3 }}> · </span>
                <span style={{ color: C.warn }}>{stats.err} err</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={reset}
                  style={{ background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2,
                    padding: "5px 10px", fontFamily: C.mono, fontSize: 10, cursor: "pointer" }}>CANCEL</button>
                <button onClick={() => { setProgress(0); setStage("committing"); }}
                  style={{ background: C.amber, border: 0, color: C.bg,
                    padding: "5px 10px", fontFamily: C.mono, fontSize: 10, cursor: "pointer", letterSpacing: 0.4 }}>
                  COMMIT {stats.ok + stats.warn} ROWS ⏎
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", marginTop: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, fontFamily: C.mono }}>
                <thead>
                  <tr style={{ color: C.ink3, textAlign: "left" }}>
                    {["", "machine", "date", "S", "h", "kWh", "kg", "rpm", "doffs", "note"].map((h, i) => (
                      <th key={i} style={{ padding: "4px 6px", borderBottom: `1px solid ${C.rule}`, fontWeight: 400, textAlign: i >= 4 && i <= 8 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{
                      background: r._status === "err" ? "rgba(196,90,58,0.08)" :
                                  r._status === "warn" ? "rgba(201,138,58,0.05)" : "transparent",
                      color: r._status === "err" ? C.ink3 : C.ink2,
                    }}>
                      <td style={{ padding: "3px 6px", color: r._status === "ok" ? C.ok : r._status === "warn" ? C.amber : C.warn }}>
                        {r._status === "ok" ? "✓" : r._status === "warn" ? "⚠" : "✗"}
                      </td>
                      <td style={{ padding: "3px 6px" }}>{r.machine_id}</td>
                      <td style={{ padding: "3px 6px", color: C.ink3 }}>{r.shift_date}</td>
                      <td style={{ padding: "3px 6px", color: C.ink3 }}>{r.shift}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: r._status === "err" ? C.warn : "inherit" }}>{r.runtime_hours}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: r._status === "warn" && r._warn?.includes("energy") ? C.amber : "inherit" }}>{r.energy_kwh}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right" }}>{r.output_kg}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right" }}>{r.spindle_rpm_avg}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right" }}>{r.doff_count}</td>
                      <td style={{ padding: "3px 6px", color: C.ink3, fontSize: 10 }}>
                        {r._err || r._warn || r.notes || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stage === "committing" && (
          <div style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.ink }}>committing to local db…</div>
            <div style={{ height: 5, background: C.ruleS, marginTop: 14 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: C.amber, transition: "width 0.1s" }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: C.ink3, lineHeight: 1.7 }}>
              {progress >= 10 && <div>{"> begin transaction"}</div>}
              {progress >= 30 && <div>{"> insert into shift_facts · 11 rows"}</div>}
              {progress >= 50 && <div>{"> insert into uploads · 1 row"}</div>}
              {progress >= 70 && <div>{"> rebuild index shift_facts_pk"}</div>}
              {progress >= 90 && <div>{"> commit · trigger model_features refresh"}</div>}
            </div>
          </div>
        )}

        {stage === "committed" && (
          <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, color: C.ok }}>✓ committed</div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.ink2 }}>
              11 rows written to <span style={{ color: C.amber }}>shift_facts</span> ·
              1 entry in <span style={{ color: C.amber }}>uploads</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: C.ink3 }}>
              model_features will refresh on next retrain (scheduled tomorrow 04:00).
            </div>
            <button onClick={reset}
              style={{ marginTop: 18, background: "transparent", border: `1px solid ${C.amber}`, color: C.amber,
                padding: "7px 14px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>
              UPLOAD ANOTHER
            </button>
          </div>
        )}
      </Panel>

      {/* Schema spec */}
      <Panel title="required_schema" right="shift_facts v3">
        <div style={{ fontSize: 10.5, lineHeight: 1.7, flex: 1, overflow: "auto" }}>
          {DC.UPLOAD_SCHEMA.map(s => (
            <div key={s.col} style={{ display: "grid", gridTemplateColumns: "1fr 50px", padding: "4px 0", borderBottom: `1px solid ${C.ruleS}` }}>
              <div>
                <span style={{ color: s.required ? C.amber : C.ink2 }}>{s.col}</span>
                <span style={{ color: C.ink3, marginLeft: 6 }}>{s.type}</span>
                <div style={{ color: C.ink3, fontSize: 10 }}>ex: <span style={{ color: C.ink2 }}>{s.example}</span></div>
              </div>
              <span style={{ textAlign: "right", color: s.required ? C.warn : C.ink3, fontSize: 10 }}>
                {s.required ? "req" : "opt"}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* PLC live channel */}
      <Panel title="plc · live channel" right={mode === "xlsx" ? "disabled" : "active"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>connection</div>
            <div style={{ fontSize: 13, color: mode === "xlsx" ? C.ink3 : C.ok }}>
              {mode === "xlsx" ? "○ standby" : "● connected"}
            </div>
            <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>Siemens S7-1500 · OPC UA</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>endpoint</div>
            <div style={{ fontSize: 11, color: C.ink2 }}>opc.tcp://192.168.4.12</div>
            <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>poll · 60s</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>tags · runtime</div>
            <div style={{ fontSize: 11, color: C.ink2 }}>DB12.MachineRuntime[1..64]</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>tags · energy</div>
            <div style={{ fontSize: 11, color: C.ink2 }}>ION9000.Active_Energy_Wh</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>buffer</div>
            <div style={{ fontSize: 11 }}>4 102 rows queued</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.ink3 }}>lag</div>
            <div style={{ fontSize: 11, color: C.ok }}>240 ms · healthy</div>
          </div>
        </div>
      </Panel>

      {/* Upload history */}
      <Panel title="upload_log · last imports" right={`${log.length} entries`}>
        <div style={{ display: "grid", gridTemplateColumns: "65px 1fr 55px 100px 80px 70px",
          padding: "4px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase" }}>
          <span>id</span><span>file</span><span style={{ textAlign: "right" }}>rows</span><span>when</span><span>user</span><span>status</span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {log.map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "65px 1fr 55px 100px 80px 70px",
              padding: "7px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11, alignItems: "center" }}>
              <span style={{ color: C.amber }}>{u.id}</span>
              <span style={{ color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{u.file}
                {u.warnings > 0 && <span style={{ color: C.amber, fontSize: 10 }}> · {u.warnings} warn</span>}
              </span>
              <span style={{ textAlign: "right", color: C.ink2 }}>{u.rows}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{u.date}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{u.user}</span>
              <span style={{ color: u.status === "committed" ? C.ok : C.warn, fontSize: 10, textTransform: "uppercase" }}>
                [{u.status}]
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Local DB */}
      <Panel title="local_db · asterope_local.duckdb" right={`${DC.DB_INFO.size_mb} MB`}>
        <div style={{ fontSize: 10.5, color: C.ink3, marginBottom: 8 }}>{DC.DB_INFO.path}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px",
          padding: "3px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 10, color: C.ink3, textTransform: "uppercase" }}>
          <span>table</span><span style={{ textAlign: "right" }}>rows</span><span>last write</span>
        </div>
        {DC.DB_INFO.tables.map(t => (
          <div key={t.name} style={{ padding: "6px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px", alignItems: "baseline" }}>
              <span style={{ color: C.ink }}>{t.name}</span>
              <span style={{ textAlign: "right", color: C.ink2, fontSize: 10.5 }}>{t.rows.toLocaleString()}</span>
              <span style={{ color: C.ink3, fontSize: 10.5 }}>{t.last_write}</span>
            </div>
            <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>{t.desc}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <button style={{ flex: 1, background: "transparent", border: `1px solid ${C.amber}`, color: C.amber, padding: "5px", fontFamily: C.mono, fontSize: 10, cursor: "pointer" }}>BACKUP</button>
          <button style={{ flex: 1, background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2, padding: "5px", fontFamily: C.mono, fontSize: 10, cursor: "pointer" }}>VACUUM</button>
          <button style={{ flex: 1, background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2, padding: "5px", fontFamily: C.mono, fontSize: 10, cursor: "pointer" }}>EXPORT</button>
        </div>
      </Panel>
    </div>
  );
}

// ─── Backfill review · full-screen takeover from Ingest ──────────────
function CBackfill({ stage, progress, file, grid, gridStats, setOneResolution, setResolutionAll, setStage, setProgress, reset }) {
  const dates = DC.BACKFILL.dates;
  const meta = DC.BACKFILL_META;

  const statusColor = (s) => ({
    "new":            { bg: "rgba(122,145,102,0.18)", fg: C.ok,    label: "new" },
    "conflict-plc":   { bg: "rgba(201,138,58,0.15)",  fg: C.amber, label: "plc" },
    "conflict-xlsx":  { bg: "rgba(196,90,58,0.15)",   fg: C.warn,  label: "xlsx" },
    "partial":        { bg: "rgba(168,165,156,0.10)", fg: C.ink2,  label: "part" },
  }[s]);

  const resColor = (r) => ({
    insert:    C.ok,
    skip:      C.ink3,
    overwrite: C.warn,
    merge:     C.amber,
  }[r]);

  if (stage === "backfill-parsing") {
    return (
      <div style={{ height: "100%", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 8 }}>{file?.name}</div>
        <div style={{ fontSize: 11, color: C.ink3, marginBottom: 18 }}>{(file?.size/1024).toFixed(1)} KB · multi-day backfill detected</div>
        <div style={{ width: 360, height: 5, background: C.ruleS }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.amber, transition: "width 0.1s" }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.ink3, fontFamily: C.mono, lineHeight: 1.8, minWidth: 480 }}>
          {progress >= 10 && <div>{"> workbook opened · 1 sheet \"shift_facts\""}</div>}
          {progress >= 25 && <div>{"> 1 339 rows × 9 cols · schema v3 ✓"}</div>}
          {progress >= 40 && <div>{"> detected date range: 2026-05-08 → 2026-05-14 (7 days)"}</div>}
          {progress >= 55 && <div>{"> mode: backfill (multi-day)"}</div>}
          {progress >= 70 && <div>{"> cross-referencing 21 shift-windows against shift_facts"}</div>}
          {progress >= 85 && <div style={{ color: C.amber }}>{"> 14 conflicts · 4 new · 3 partial · ready for review"}</div>}
        </div>
      </div>
    );
  }

  if (stage === "backfill-committing") {
    return (
      <div style={{ height: "100%", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 18 }}>writing {gridStats.rowsToWrite} rows to shift_facts…</div>
        <div style={{ width: 420, height: 5, background: C.ruleS }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.amber, transition: "width 0.1s" }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.ink3, fontFamily: C.mono, lineHeight: 1.8, minWidth: 520 }}>
          {progress >= 10 && <div>{"> begin transaction (backfill mode)"}</div>}
          {progress >= 25 && <div>{`> insert ${gridStats.insert * 64} rows · ${gridStats.insert} new shifts`}</div>}
          {progress >= 45 && <div>{`> overwrite ${gridStats.overwrite * 64} rows · audit kept under uploads.history`}</div>}
          {progress >= 65 && <div>{`> merge ${gridStats.merge * 64} rows · resolved on (machine_id, shift_id)`}</div>}
          {progress >= 80 && <div>{`> skip ${gridStats.skip} shift-windows · PLC takes precedence`}</div>}
          {progress >= 95 && <div style={{ color: C.ok }}>{"> commit · model_features marked stale · retrain queued for 04:00"}</div>}
        </div>
      </div>
    );
  }

  if (stage === "backfill-committed") {
    return (
      <div style={{ height: "100%", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 32, color: C.ok }}>✓ backfill committed</div>
        <div style={{ marginTop: 10, fontSize: 13, color: C.ink2 }}>
          {gridStats.rowsToWrite} rows written · 1 entry in <span style={{ color: C.amber }}>uploads</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: C.ink3, maxWidth: 540, textAlign: "center", lineHeight: 1.6 }}>
          model_features marked stale. Next retrain (scheduled 04:00) will include the 7-day backfill window.
          Source mix for the resulting model will shift toward xlsx for that range.
        </div>
        <button onClick={reset}
          style={{ marginTop: 24, background: "transparent", border: `1px solid ${C.amber}`, color: C.amber,
            padding: "8px 18px", fontFamily: C.mono, fontSize: 11, cursor: "pointer" }}>
          ← BACK TO INGEST
        </button>
      </div>
    );
  }

  // Backfill review
  return (
    <div style={{ height: "100%", padding: 12, display: "grid",
      gridTemplateColumns: "1.7fr 1fr",
      gridTemplateRows: "auto 1fr auto", gap: 10, overflow: "hidden" }}>

      <Panel title={`backfill review · ${meta.file}`} right={`${meta.range_start} → ${meta.range_end} · ${meta.days}d · ${meta.shifts} shifts`} style={{ gridColumn: "span 2" }} pad={10}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, fontSize: 11 }}>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>parsed rows</div><div style={{ fontSize: 18 }}>{meta.parsed_rows.toLocaleString()}</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>new windows</div><div style={{ fontSize: 18, color: C.ok }}>{gridStats.new}</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>plc conflicts</div><div style={{ fontSize: 18, color: C.amber }}>{gridStats.confPlc}</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>xlsx conflicts</div><div style={{ fontSize: 18, color: C.warn }}>{gridStats.confXlsx}</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>partial cover</div><div style={{ fontSize: 18, color: C.ink2 }}>{gridStats.partial}</div></div>
          <div><div style={{ color: C.ink3, fontSize: 10 }}>rows to write</div><div style={{ fontSize: 18, color: C.amber }}>{gridStats.rowsToWrite.toLocaleString()}</div></div>
        </div>
      </Panel>

      <Panel title="conflict map · click a cell to resolve" right="3 shifts/day × 7 days = 21 windows">
        <div style={{ marginTop: 8, marginBottom: 14 }}>
          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: 4, fontSize: 10 }}>
            <div></div>
            {dates.map(d => (
              <div key={d.date} style={{ textAlign: "center", color: C.ink3 }}>
                <div>{d.weekday}</div>
                <div style={{ color: C.ink2 }}>{d.label}</div>
              </div>
            ))}
            {["A", "B", "C"].map(L => (
              <React.Fragment key={L}>
                <div style={{ display: "flex", alignItems: "center", color: C.ink2, fontSize: 11 }}>
                  shift {L}
                  <span style={{ color: C.ink3, fontSize: 9, marginLeft: 4 }}>
                    {L === "A" ? "06–14" : L === "B" ? "14–22" : "22–06"}
                  </span>
                </div>
                {dates.map(d => {
                  const cell = grid.find(g => g.date === d.date && g.shift === L);
                  if (!cell) return <div key={d.date} />;
                  const sc = statusColor(cell.status);
                  return (
                    <button key={cell.id}
                      style={{
                        background: sc.bg, border: `1px solid ${cell.resolution === "skip" ? C.ink4 : sc.fg}`,
                        color: C.ink, padding: 6, cursor: "pointer", fontFamily: C.mono,
                        display: "flex", flexDirection: "column", alignItems: "center",
                      }}
                      onClick={() => {
                        // cycle through resolutions
                        const opts = cell.status === "new" ? ["insert", "skip"] :
                                     cell.status === "partial" ? ["merge", "overwrite", "skip"] :
                                     ["skip", "overwrite", "merge"];
                        const next = opts[(opts.indexOf(cell.resolution) + 1) % opts.length];
                        setOneResolution(cell.id, next);
                      }}>
                      <span style={{ fontSize: 10, color: sc.fg }}>{sc.label}</span>
                      <span style={{ fontSize: 10, color: resColor(cell.resolution), marginTop: 2 }}>
                        ▸ {cell.resolution}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.rule}` }}>
          <div style={{ fontSize: 10, color: C.ink3, marginBottom: 6 }}>legend</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10.5 }}>
            <span><span style={{ color: C.ok }}>■</span> new — no existing data</span>
            <span><span style={{ color: C.amber }}>■</span> plc conflict — existing live data</span>
            <span><span style={{ color: C.warn }}>■</span> xlsx conflict — existing upload</span>
            <span><span style={{ color: C.ink2 }}>■</span> partial — some machines missing</span>
          </div>
        </div>
      </Panel>

      <Panel title="resolution strategy" right="bulk apply to all conflicts">
        <div style={{ fontSize: 11, color: C.ink3, marginBottom: 8 }}>
          for plc & xlsx conflicts (14 windows):
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "skip", label: "skip · keep existing", sub: "no DB change · file rows discarded", color: C.ink3 },
            { id: "overwrite", label: "overwrite · file wins", sub: "old values archived to uploads.history", color: C.warn },
            { id: "merge", label: "merge · prefer non-null", sub: "fill DB nulls from file; otherwise keep DB", color: C.amber },
          ].map(o => (
            <button key={o.id} onClick={() => setResolutionAll(o.id)}
              style={{ border: `1px solid ${C.rule}`, background: "transparent", color: C.ink,
                padding: "7px 10px", textAlign: "left", fontFamily: C.mono, fontSize: 11, cursor: "pointer" }}>
              <div style={{ color: o.color }}>▸ {o.label}</div>
              <div style={{ color: C.ink3, fontSize: 10, marginTop: 2 }}>{o.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, fontSize: 10.5, color: C.ink2, lineHeight: 1.8 }}>
          <div>current per-cell mix:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 50px", marginTop: 4 }}>
            <span style={{ color: C.ok }}>insert (new)</span><span style={{ textAlign: "right" }}>{gridStats.insert}</span>
            <span style={{ color: C.amber }}>merge</span><span style={{ textAlign: "right" }}>{gridStats.merge}</span>
            <span style={{ color: C.warn }}>overwrite</span><span style={{ textAlign: "right" }}>{gridStats.overwrite}</span>
            <span style={{ color: C.ink3 }}>skip</span><span style={{ textAlign: "right" }}>{gridStats.skip}</span>
          </div>
        </div>
      </Panel>

      <Panel title="commit summary" style={{ gridColumn: "span 2" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11.5, color: C.ink2 }}>
            <span style={{ color: C.amber }}>{gridStats.rowsToWrite.toLocaleString()} rows</span> will be written to
            <span style={{ color: C.amber }}> shift_facts</span> ·
            old values from <span style={{ color: C.warn }}>{gridStats.overwrite}</span> overwritten shifts will be archived to
            <span style={{ color: C.amber }}> uploads.history</span> ·
            model_features will be marked stale, triggering retrain at 04:00.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={reset}
              style={{ background: "transparent", border: `1px solid ${C.ink3}`, color: C.ink2,
                padding: "8px 14px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer" }}>CANCEL</button>
            <button onClick={() => { setProgress(0); setStage("backfill-committing"); }}
              style={{ background: C.amber, border: 0, color: C.bg,
                padding: "8px 14px", fontFamily: C.mono, fontSize: 10.5, cursor: "pointer", letterSpacing: 0.4 }}>
              COMMIT BACKFILL ⏎
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CSet() {
  const [thr, setThr] = useStateC({ z: 3.5, kw: 280, idle: 9, tariff: 6.80 });
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, overflow: "hidden" }}>
      <Panel title="detection_thresholds">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <CKnob label="anomaly_z_score" val={thr.z.toFixed(2)} set={(v)=>setThr({...thr,z:+v})} min={2} max={6} step={0.05} u="σ" />
          <CKnob label="kw_deviation" val={thr.kw} set={(v)=>setThr({...thr,kw:+v})} min={50} max={600} step={10} u="kW" />
          <CKnob label="idle_lockout" val={thr.idle} set={(v)=>setThr({...thr,idle:+v})} min={3} max={20} step={0.5} u="min" />
          <CKnob label="tariff_inr_per_kwh" val={thr.tariff.toFixed(2)} set={(v)=>setThr({...thr,tariff:+v})} min={3} max={12} step={0.05} u="" />
        </div>
        <div style={{ marginTop: 18, padding: "8px 10px", background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 11, color: C.ink2, lineHeight: 1.7 }}>
          tpi_tolerance ≤ 3%<br/>
          rpm_min = 7 200<br/>
          rpm_max = 12 600<br/>
          doff_stagger_min = 12 min<br/>
          off_peak = [22:00, 06:00)
        </div>
      </Panel>

      <Panel title="data_sources">
        {[["plc.siemens_s7","192.168.4.0/22","live"],["powerlogic.ion9000","192.168.6.10:502","live"],["mes.tagit_v4","mes.gomati.local","live"],["ambient.openweather","api.openweathermap.org","live"],["maint.sap_pm","sap.gomati.local","stale"]].map(([n, addr, st]) => (
          <div key={n} style={{ padding: "8px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.ink }}>{n}</span>
              <span style={{ color: st === "live" ? C.ok : C.warn, fontSize: 10 }}>[{st}]</span>
            </div>
            <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>{addr}</div>
          </div>
        ))}
      </Panel>

      <Panel title="notifications">
        {[["high_severity_anomaly","sms,email"],["daily_energy_report","email · 06:00"],["weekly_opt_digest","email · mon 08:00"],["model_drift_alert","slack #energy-ops"],["retrain_complete","email,slack"]].map(([k, v]) => (
          <div key={k} style={{ padding: "8px 0", borderBottom: `1px solid ${C.ruleS}`, fontSize: 11 }}>
            <div style={{ color: C.ink }}>{k}</div>
            <div style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>→ {v}</div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "8px 10px", background: C.bg, border: `1px solid ${C.ruleS}`, fontSize: 10.5, color: C.ink3 }}>
          asterope · 2.6.1<br/>
          build 4c821e · 22 may 2026<br/>
          host: console-01.gomati.local
        </div>
      </Panel>
    </div>
  );
}

function ConsoleApp() {
  const [active, setActive] = useStateC("dash");
  const [tick, setTick] = useStateC(0);
  useEffectC(() => { const t = setInterval(() => setTick(x => x + 1), 1500); return () => clearInterval(t); }, []);
  const View = { dash: CDash, predict: CPredict, reco: CReco, anom: CAnom, hist: CHist, drill: CDrill, train: CTrain, ingest: CIngest, set: CSet }[active];
  return (
    <CShell active={active} setActive={setActive}>
      <div data-screen-label={(SCREENS_C.findIndex(s => s.id===active)+1).toString().padStart(2,"0") + " " + SCREENS_C.find(s=>s.id===active).label}
        style={{ height: "100%", overflow: "hidden" }}>
        <View tick={tick} />
      </div>
    </CShell>
  );
}

window.ConsoleApp = ConsoleApp;
