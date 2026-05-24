// Synthetic but plausible data for a TFO (two-for-one) twister plant.
// 64 machines, each ~144 spindles, twisting two cotton yarns together.
// Power per spindle ~80-120W; daily kWh per machine ~900-1500.

(function () {
  // Deterministic PRNG so values are stable across renders
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const STATUSES = ["running", "running", "running", "running", "running", "idle", "doff", "fault", "maint"];
  const YARNS = [
    { name: "Cotton 30/2", denier: 295, ply: 2 },
    { name: "Cotton 40/2", denier: 220, ply: 2 },
    { name: "Cotton 20/2", denier: 440, ply: 2 },
    { name: "PolyCotton 30/2", denier: 295, ply: 2 },
    { name: "Viscose 30/2", denier: 295, ply: 2 },
  ];
  const LINES = ["A", "B", "C", "D"];

  function buildMachines() {
    const rnd = mulberry32(42);
    const arr = [];
    for (let i = 0; i < 64; i++) {
      const id = `TFO-${String(i + 1).padStart(3, "0")}`;
      const line = LINES[i % 4];
      const spindles = 96 + Math.floor(rnd() * 4) * 24; // 96, 120, 144, 168
      const yarn = YARNS[Math.floor(rnd() * YARNS.length)];
      const rpm = 8200 + Math.floor(rnd() * 4000); // 8200-12200
      const twistMultiplier = 3.2 + rnd() * 0.8;
      const tpi = +(twistMultiplier * Math.sqrt(yarn.denier / 100) * 1.6).toFixed(1);
      const status = STATUSES[Math.floor(rnd() * STATUSES.length)];
      // Energy load — running is high, idle low, fault 0, doff low
      const baseW = spindles * (80 + rnd() * 40);
      let load = baseW;
      if (status === "idle") load = baseW * 0.18;
      else if (status === "doff") load = baseW * 0.32;
      else if (status === "fault" || status === "maint") load = 0;
      const kwh24 = (status === "fault" || status === "maint")
        ? 0
        : +(((baseW / 1000) * (status === "running" ? 22 + rnd() * 1.5 : 16 + rnd() * 4))).toFixed(0);
      const runtime24 = status === "fault" ? 0 : status === "maint" ? 2 + rnd() * 3 : 18 + rnd() * 5.5;
      const efficiency = status === "fault" ? 0 : 0.62 + rnd() * 0.32;
      const cluster = efficiency > 0.86 ? "A" : efficiency > 0.78 ? "B" : efficiency > 0.7 ? "C" : "D";
      arr.push({
        id,
        line,
        status,
        spindles,
        yarn: yarn.name,
        denier: yarn.denier,
        ply: yarn.ply,
        rpm,
        tpi,
        twistMultiplier: +twistMultiplier.toFixed(2),
        kw: +(load / 1000).toFixed(2),
        kwh24,
        runtime24: +runtime24.toFixed(1),
        efficiency: +efficiency.toFixed(3),
        cluster,
        kwhPerKg: +(0.9 + (1 - efficiency) * 1.8 + rnd() * 0.15).toFixed(2),
        doffsToday: Math.floor(2 + rnd() * 5),
        commissioned: 2014 + Math.floor(rnd() * 11),
      });
    }
    return arr;
  }

  const MACHINES = buildMachines();

  // Build a 24h time series for the whole plant — kWh load per minute
  function buildPlantSeries() {
    const rnd = mulberry32(7);
    const pts = [];
    const N = 96; // 15-min intervals over 24h
    for (let i = 0; i < N; i++) {
      const hour = i / 4;
      // diurnal pattern, with shift changes at 6, 14, 22
      let base = 4800 + 1200 * Math.sin((hour - 4) * Math.PI / 12);
      if (hour > 6 && hour < 14) base += 600;
      if (hour > 14 && hour < 22) base += 300;
      // shift change dips
      if (Math.abs(hour - 6) < 0.3 || Math.abs(hour - 14) < 0.3 || Math.abs(hour - 22) < 0.3) base -= 1100;
      const actual = base + (rnd() - 0.5) * 280;
      const predicted = base + (rnd() - 0.5) * 110;
      pts.push({ t: i, hour, actual: +actual.toFixed(0), predicted: +predicted.toFixed(0) });
    }
    return pts;
  }

  // 14-day history
  function buildHistory() {
    const rnd = mulberry32(11);
    const days = [];
    const now = new Date(2026, 4, 24); // May 24, 2026
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const base = weekend ? 92000 : 118000;
      const actual = base + (rnd() - 0.5) * 7000;
      const predicted = base + (rnd() - 0.5) * 2400;
      const production = (actual / (1.7 + rnd() * 0.4));
      days.push({
        date: d,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        kwh: +actual.toFixed(0),
        predicted: +predicted.toFixed(0),
        kg: +production.toFixed(0),
        kwhPerKg: +(actual / production).toFixed(2),
        anomalies: Math.floor(rnd() * (weekend ? 2 : 5)),
      });
    }
    return days;
  }

  // Recommendations — actions the ML proposed
  const RECOMMENDATIONS = [
    {
      id: "R-2419",
      machine: "TFO-027",
      title: "Reduce spindle speed 9 800 → 9 200 RPM",
      detail: "Current twist quality margin is +14%. Speed reduction holds TPI within spec and cuts draw on motor.",
      savings_kwh: 184, savings_pct: 11.2, confidence: 0.91, horizon: "per day", category: "speed",
    },
    {
      id: "R-2418",
      machine: "Line B (16 machines)",
      title: "Shift maintenance window to 02:00–04:30",
      detail: "Demand baseline is 38% lower in this window vs current 14:00 window. Overlap with off-peak tariff.",
      savings_kwh: 612, savings_pct: 4.8, confidence: 0.86, horizon: "per week", category: "schedule",
    },
    {
      id: "R-2416",
      machine: "TFO-041",
      title: "Re-cluster from group D → C",
      detail: "Idle-loss has dropped 22% since spindle bearing change. Move to cluster C for tighter monitoring thresholds.",
      savings_kwh: 47, savings_pct: 2.1, confidence: 0.78, horizon: "per day", category: "cluster",
    },
    {
      id: "R-2415",
      machine: "TFO-012, TFO-013, TFO-019",
      title: "Stagger doff cycles to flatten 14:00 peak",
      detail: "Three machines currently doffing within 8 min of each other adds 1.4 MW spike. Stagger to 20-min offsets.",
      savings_kwh: 96, savings_pct: 1.6, confidence: 0.83, horizon: "per day", category: "schedule",
    },
    {
      id: "R-2412",
      machine: "TFO-053",
      title: "Idle-state lockout after 9 min",
      detail: "Spindle drive remains energized during operator breaks. Auto-shutoff would save 31 kWh/day.",
      savings_kwh: 31, savings_pct: 3.4, confidence: 0.94, horizon: "per day", category: "idle",
    },
    {
      id: "R-2410",
      machine: "Plant-wide",
      title: "Pre-heat coolant loop on demand, not schedule",
      detail: "Current scheduled pre-heat runs 04:30 daily. Model predicts demand peak shifted 35 min later this month.",
      savings_kwh: 220, savings_pct: 0.9, confidence: 0.71, horizon: "per day", category: "schedule",
    },
  ];

  const ANOMALIES = [
    { id: "A-8814", time: "14:32", machine: "TFO-027", severity: "high",   kind: "Energy draw +28% over baseline",         status: "open" },
    { id: "A-8813", time: "13:51", machine: "TFO-041", severity: "med",    kind: "Spindle RPM oscillation (σ 142 rpm)",     status: "open" },
    { id: "A-8812", time: "13:04", machine: "TFO-019", severity: "low",    kind: "Idle dwell exceeded 12 min",              status: "ack"  },
    { id: "A-8811", time: "12:48", machine: "TFO-053", severity: "high",   kind: "kWh/kg 2.4× cluster median",             status: "open" },
    { id: "A-8810", time: "11:22", machine: "TFO-008", severity: "med",    kind: "Power factor below 0.81",                 status: "open" },
    { id: "A-8809", time: "10:14", machine: "TFO-061", severity: "low",    kind: "Tension sensor drift (calibration due)",  status: "resolved" },
    { id: "A-8808", time: "09:33", machine: "TFO-012", severity: "med",    kind: "Doff cycle 38% over expected duration",   status: "ack"  },
    { id: "A-8807", time: "08:59", machine: "TFO-033", severity: "low",    kind: "Yarn break rate +60% vs 7-day avg",       status: "resolved" },
    { id: "A-8806", time: "07:42", machine: "TFO-027", severity: "med",    kind: "Motor temp 78°C (warn at 75°C)",          status: "resolved" },
  ];

  const MODEL_RUNS = [
    { id: "v2026.05.21-3", date: "21 May 2026 04:12", mape: 3.41, rmse: 218, status: "deployed", rows: 4_181_204, params: "Gradient Boosted Trees · 180 est. · depth 6",
      sources: { plc: 0.84, xlsx: 0.12, manual: 0.04 }, uploads: ["UP-0241","UP-0240","UP-0239","UP-0238"], training_window: "21 Apr – 20 May" },
    { id: "v2026.05.14-2", date: "14 May 2026 04:08", mape: 3.78, rmse: 244, status: "archived", rows: 3_988_111, params: "Gradient Boosted Trees · 160 est. · depth 6",
      sources: { plc: 0.87, xlsx: 0.11, manual: 0.02 }, uploads: ["UP-0234","UP-0233","UP-0232"], training_window: "14 Apr – 13 May" },
    { id: "v2026.05.07-1", date: "07 May 2026 04:05", mape: 4.02, rmse: 261, status: "archived", rows: 3_811_540, params: "Gradient Boosted Trees · 160 est. · depth 5",
      sources: { plc: 0.82, xlsx: 0.14, manual: 0.04 }, uploads: ["UP-0228","UP-0227"], training_window: "07 Apr – 06 May" },
    { id: "v2026.04.30-2", date: "30 Apr 2026 04:14", mape: 4.19, rmse: 274, status: "archived", rows: 3_644_780, params: "Random Forest · 120 est. · depth 8",
      sources: { plc: 0.76, xlsx: 0.22, manual: 0.02 }, uploads: ["UP-0221","UP-0220","UP-0219"], training_window: "31 Mar – 29 Apr" },
  ];

  const FEATURES = [
    { name: "spindle_rpm",          importance: 0.31 },
    { name: "runtime_hours_24h",    importance: 0.24 },
    { name: "yarn_denier",          importance: 0.13 },
    { name: "ambient_temp_c",       importance: 0.08 },
    { name: "spindle_count",        importance: 0.07 },
    { name: "twist_multiplier",     importance: 0.06 },
    { name: "doff_count_24h",       importance: 0.05 },
    { name: "machine_age_years",    importance: 0.03 },
    { name: "shift_id",             importance: 0.02 },
    { name: "humidity_pct",         importance: 0.01 },
  ];

  const CLUSTERS = [
    { id: "A", label: "Tier-1 efficient",  count: 14, kwhPerKg: 1.18, color: "#222" },
    { id: "B", label: "Steady performers", count: 22, kwhPerKg: 1.41, color: "#555" },
    { id: "C", label: "Watch list",        count: 18, kwhPerKg: 1.72, color: "#888" },
    { id: "D", label: "Underperformers",   count: 10, kwhPerKg: 2.18, color: "#bbb" },
  ];

  // For machine drilldown: build a 24h spindle-RPM + kW series for a single machine
  function buildMachineSeries(seed) {
    const rnd = mulberry32(seed);
    const pts = [];
    for (let i = 0; i < 96; i++) {
      const hour = i / 4;
      let rpm = 9400 + Math.sin(hour * 0.5) * 140 + (rnd() - 0.5) * 80;
      let kw = (rpm / 9400) * 13 + (rnd() - 0.5) * 1.2;
      // doff cycles drop both
      if ((hour > 5.8 && hour < 6.1) || (hour > 11.6 && hour < 12.0) || (hour > 17.5 && hour < 17.9)) {
        rpm *= 0.35; kw *= 0.4;
      }
      pts.push({ t: i, hour, rpm: +rpm.toFixed(0), kw: +kw.toFixed(2) });
    }
    return pts;
  }

  // ─── shift-level history ──────────────────────────────────────────
  // Smallest persisted window = one shift (8h). 3 shifts/day:
  //   A · 06:00–14:00   B · 14:00–22:00   C · 22:00–06:00 (next day)
  // 14 days × 3 = 42 shifts. Each has runtime, energy, output, source.
  function buildShiftHistory() {
    const rnd = mulberry32(23);
    const now = new Date(2026, 4, 24);
    const out = [];
    const letters = ["A", "B", "C"];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      letters.forEach((L, j) => {
        const base = weekend ? 30800 : 39400;
        const energy = +(base + (rnd() - 0.5) * 2800 - (L === "C" ? 2400 : 0)).toFixed(0);
        const runtime = +(7.1 + rnd() * 0.85 - (L === "C" ? 0.3 : 0)).toFixed(2);
        const output = +((energy / (1.55 + rnd() * 0.4))).toFixed(0);
        // current shift (most recent, "B" today) is "live · partial"
        const isCurrent = i === 0 && L === "B";
        const sources = ["plc", "plc", "plc", "plc", "plc", "xlsx", "plc"];
        const source = isCurrent ? "plc-live" : sources[Math.floor(rnd() * sources.length)];
        out.push({
          id: `${d.toISOString().slice(0,10)}-${L}`,
          date: d.toISOString().slice(0,10),
          dateLabel: `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`,
          shift: L,
          start: L === "A" ? "06:00" : L === "B" ? "14:00" : "22:00",
          end:   L === "A" ? "14:00" : L === "B" ? "22:00" : "06:00",
          runtime_h: isCurrent ? +(runtime * 0.55).toFixed(2) : runtime,
          energy_kwh: isCurrent ? +(energy * 0.55).toFixed(0) : energy,
          output_kg: isCurrent ? +(output * 0.55).toFixed(0) : output,
          kwh_per_kg: isCurrent ? null : +(energy / output).toFixed(2),
          anomalies: Math.floor(rnd() * (weekend ? 2 : 4)),
          partial: isCurrent,
          source,
        });
      });
    }
    return out;
  }

  // Upload log — Excel uploads that have been ingested
  const UPLOAD_LOG = [
    { id: "UP-0241", file: "shift_2026-05-20.xlsx",    rows: 192,  date: "20 May 2026 23:08", user: "n.agarwal",   status: "committed", warnings: 0 },
    { id: "UP-0240", file: "shift_2026-05-19.xlsx",    rows: 192,  date: "19 May 2026 23:14", user: "n.agarwal",   status: "committed", warnings: 2 },
    { id: "UP-0239", file: "backfill_apr_w4.xlsx",     rows: 1344, date: "18 May 2026 11:22", user: "r.prakash",   status: "committed", warnings: 0 },
    { id: "UP-0238", file: "shift_2026-05-18.xlsx",    rows: 192,  date: "18 May 2026 23:02", user: "n.agarwal",   status: "committed", warnings: 0 },
    { id: "UP-0237", file: "shift_2026-05-17_v2.xlsx", rows: 192,  date: "17 May 2026 23:38", user: "n.agarwal",   status: "committed", warnings: 1 },
    { id: "UP-0236", file: "shift_2026-05-17.xlsx",    rows: 192,  date: "17 May 2026 23:11", user: "n.agarwal",   status: "rejected",  warnings: 4 },
  ];

  // Required schema — what an Excel upload must contain
  const UPLOAD_SCHEMA = [
    { col: "machine_id",       type: "string",   required: true,  example: "TFO-014" },
    { col: "shift_date",       type: "date",     required: true,  example: "2026-05-24" },
    { col: "shift",            type: "A|B|C",    required: true,  example: "B" },
    { col: "runtime_hours",    type: "number",   required: true,  example: "7.42" },
    { col: "energy_kwh",       type: "number",   required: true,  example: "612.0" },
    { col: "output_kg",        type: "number",   required: false, example: "402" },
    { col: "spindle_rpm_avg",  type: "number",   required: false, example: "9420" },
    { col: "doff_count",       type: "number",   required: false, example: "3" },
    { col: "notes",            type: "string",   required: false, example: "yarn break ×2 spindle 41" },
  ];

  // Sample preview rows — what a parsed Excel looks like before commit
  const SAMPLE_PARSED_ROWS = [
    { machine_id: "TFO-014", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.55, energy_kwh: 581.2, output_kg: 388, spindle_rpm_avg: 9380, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-015", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.61, energy_kwh: 604.8, output_kg: 401, spindle_rpm_avg: 9420, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-016", shift_date: "2026-05-23", shift: "C", runtime_hours: 6.84, energy_kwh: 522.0, output_kg: 344, spindle_rpm_avg: 9180, doff_count: 2, notes: "operator break 22:40-23:08", _status: "ok" },
    { machine_id: "TFO-017", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.51, energy_kwh: 612.3, output_kg: 398, spindle_rpm_avg: 9410, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-018", shift_date: "2026-05-23", shift: "C", runtime_hours: 0.00, energy_kwh: 0.0,   output_kg: 0,   spindle_rpm_avg: 0,    doff_count: 0, notes: "scheduled maint", _status: "warn", _warn: "zero runtime · maintenance flag detected" },
    { machine_id: "TFO-019", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.43, energy_kwh: 598.1, output_kg: 392, spindle_rpm_avg: 9400, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-020", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.58, energy_kwh: 891.4, output_kg: 401, spindle_rpm_avg: 9410, doff_count: 3, notes: "", _status: "warn", _warn: "energy +47% over 7-shift median · review" },
    { machine_id: "TFO-021", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.49, energy_kwh: 588.7, output_kg: 391, spindle_rpm_avg: 9390, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-022", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.61, energy_kwh: 611.0, output_kg: 405, spindle_rpm_avg: 9430, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-023", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.36, energy_kwh: 571.4, output_kg: 380, spindle_rpm_avg: 9350, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-024", shift_date: "2026-05-23", shift: "C", runtime_hours: 7.54, energy_kwh: 597.2, output_kg: 397, spindle_rpm_avg: 9400, doff_count: 3, notes: "", _status: "ok" },
    { machine_id: "TFO-025", shift_date: "2026-05-23", shift: "C", runtime_hours: "—",  energy_kwh: 605.0, output_kg: 398, spindle_rpm_avg: 9410, doff_count: 3, notes: "", _status: "err",  _err:  "runtime_hours missing · required field" },
  ];

  // Backfill — a multi-day Excel that needs conflict resolution.
  // 7 days × 3 shifts = 21 shift-windows. For each window, status describes
  // whether the DB already has data for it (and from which source).
  function buildBackfillMap() {
    // Dates 2026-05-08 to 2026-05-14 (7 days, 3 shifts each)
    const dates = [];
    const start = new Date(2026, 4, 8);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      dates.push({
        date: d.toISOString().slice(0,10),
        label: `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`,
        weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
      });
    }
    // Per-shift status: "new" (no existing), "conflict-plc" (existing plc data),
    //                   "conflict-xlsx" (existing xlsx data), "partial" (some machines missing in DB)
    const rnd = mulberry32(101);
    const grid = [];
    dates.forEach((d, di) => {
      ["A", "B", "C"].forEach((L) => {
        // simulate: most existing shifts have PLC; a few have xlsx; one is missing
        const r = rnd();
        let status = "conflict-plc";
        if (di === 3 && L === "C") status = "new";              // missing in DB
        else if (di === 5 && L === "A") status = "conflict-xlsx"; // overlapping xlsx
        else if (di === 6 && L === "B") status = "partial";       // only 41/64 machines logged
        else if (r < 0.08) status = "new";
        else if (r < 0.18) status = "conflict-xlsx";
        else if (r < 0.28) status = "partial";
        const machines_in_file = (status === "partial" ? 41 : 64);
        const machines_existing = status === "new" ? 0 :
          status === "partial" ? 41 : 64;
        grid.push({
          id: `${d.date}-${L}`,
          date: d.date,
          dateLabel: d.label,
          weekday: d.weekday,
          shift: L,
          status,
          rows_in_file: machines_in_file,
          rows_in_db: machines_existing,
          // Default resolution per status
          resolution: status === "new" ? "insert" :
                      status === "conflict-plc" ? "skip" :
                      status === "conflict-xlsx" ? "overwrite" :
                      "merge",
        });
      });
    });
    return { dates, grid };
  }

  const BACKFILL = buildBackfillMap();
  const BACKFILL_META = {
    file: "backfill_may_w2.xlsx",
    size_kb: 412.4,
    range_start: "2026-05-08",
    range_end:   "2026-05-14",
    days: 7, shifts: 21, machines: 64,
    total_rows: 1339,         // some shifts have partial coverage
    parsed_rows: 1339,
    schema_ok: true,
    detected: "backfill (multi-day range)",
  };

  const DB_INFO = {
    name: "asterope_local.duckdb",
    path: "/var/asterope/db",
    size_mb: 412.6,
    tables: [
      { name: "shift_facts",      rows: 22_414, last_write: "now",      desc: "shift-level runtime + energy + output per machine" },
      { name: "anomaly_log",      rows: 1_181,  last_write: "14:32",    desc: "ML-flagged anomalies, severity, status" },
      { name: "model_predictions",rows: 22_414, last_write: "06:00",    desc: "predicted vs actual kWh per shift" },
      { name: "machines",         rows: 64,     last_write: "12 May",   desc: "machine registry + spec" },
      { name: "uploads",          rows: 241,    last_write: "20 May",   desc: "audit log of Excel imports" },
      { name: "plc_raw_archive",  rows: 4_181_204, last_write: "now",   desc: "1-min PLC snapshots (90-day TTL)" },
    ],
  };

  window.PlantData = {
    MACHINES,
    PLANT_SERIES: buildPlantSeries(),
    HISTORY: buildHistory(),
    SHIFT_HISTORY: buildShiftHistory(),
    RECOMMENDATIONS,
    ANOMALIES,
    MODEL_RUNS,
    FEATURES,
    CLUSTERS,
    UPLOAD_LOG,
    UPLOAD_SCHEMA,
    SAMPLE_PARSED_ROWS,
    BACKFILL,
    BACKFILL_META,
    DB_INFO,
    buildMachineSeries,
  };
})();
