"""
Synthetic but plausible data for a TFO (two-for-one) twister plant.
64 machines, each ~144 spindles, twisting two cotton yarns together.
Power per spindle ~80-120W; daily kWh per machine ~900-1500.

Deterministic PRNG ported from JS mulberry32 so values match the prototype.
"""
from __future__ import annotations
import math
from datetime import date, timedelta
from typing import Callable


# ── PRNG ─────────────────────────────────────────────────────────────────────

def _to_i32(v: int) -> int:
    v = v & 0xFFFF_FFFF
    return v - 0x1_0000_0000 if v >= 0x8000_0000 else v


def _imul(a: int, b: int) -> int:
    return _to_i32((a & 0xFFFF_FFFF) * (b & 0xFFFF_FFFF))


def _urshift(v: int, n: int) -> int:
    return (v & 0xFFFF_FFFF) >> n


def mulberry32(seed: int) -> Callable[[], float]:
    state = [seed]

    def rng() -> float:
        a = state[0]
        a = _to_i32(a)
        a = _to_i32(a + 0x6D2B79F5)
        state[0] = a
        t = a
        t = _imul(t ^ _urshift(t, 15), t | 1)
        t ^= _to_i32(t + _imul(t ^ _urshift(t, 7), t | 61))
        return _urshift(t ^ _urshift(t, 14), 0) / 4_294_967_296

    return rng


# ── Static lookup tables ──────────────────────────────────────────────────────

STATUSES = ["running", "running", "running", "running", "running",
            "idle", "doff", "fault", "maint"]

YARNS = [
    {"name": "Cotton 30/2",    "denier": 295, "ply": 2},
    {"name": "Cotton 40/2",    "denier": 220, "ply": 2},
    {"name": "Cotton 20/2",    "denier": 440, "ply": 2},
    {"name": "PolyCotton 30/2","denier": 295, "ply": 2},
    {"name": "Viscose 30/2",   "denier": 295, "ply": 2},
]

LINES = ["A", "B", "C", "D"]


# ── Builders ─────────────────────────────────────────────────────────────────

def build_machines() -> list[dict]:
    rnd = mulberry32(42)
    arr = []
    for i in range(64):
        machine_id = f"TFO-{i + 1:03d}"
        line = LINES[i % 4]
        spindles = 96 + int(rnd() * 4) * 24
        yarn = YARNS[int(rnd() * len(YARNS))]
        rpm = 8200 + int(rnd() * 4000)
        twist_multiplier = 3.2 + rnd() * 0.8
        tpi = round(twist_multiplier * math.sqrt(yarn["denier"] / 100) * 1.6, 1)
        status = STATUSES[int(rnd() * len(STATUSES))]
        base_w = spindles * (80 + rnd() * 40)
        if status == "idle":
            load = base_w * 0.18
        elif status == "doff":
            load = base_w * 0.32
        elif status in ("fault", "maint"):
            load = 0.0
        else:
            load = base_w
        if status in ("fault", "maint"):
            kwh24 = 0
        else:
            hours = (22 + rnd() * 1.5) if status == "running" else (16 + rnd() * 4)
            kwh24 = int((base_w / 1000) * hours)
        if status == "fault":
            runtime24 = 0.0
        elif status == "maint":
            runtime24 = round(2 + rnd() * 3, 1)
        else:
            runtime24 = round(18 + rnd() * 5.5, 1)
        efficiency = 0.0 if status == "fault" else round(0.62 + rnd() * 0.32, 3)
        if efficiency > 0.86:
            cluster = "A"
        elif efficiency > 0.78:
            cluster = "B"
        elif efficiency > 0.70:
            cluster = "C"
        else:
            cluster = "D"
        arr.append({
            "id": machine_id,
            "line": line,
            "status": status,
            "spindles": spindles,
            "yarn": yarn["name"],
            "denier": yarn["denier"],
            "ply": yarn["ply"],
            "rpm": rpm,
            "tpi": tpi,
            "twistMultiplier": round(twist_multiplier, 2),
            "kw": round(load / 1000, 2),
            "kwh24": kwh24,
            "runtime24": runtime24,
            "efficiency": efficiency,
            "cluster": cluster,
            "kwhPerKg": round(0.9 + (1 - efficiency) * 1.8 + rnd() * 0.15, 2),
            "doffsToday": int(2 + rnd() * 5),
            "commissioned": 2014 + int(rnd() * 11),
        })
    return arr


def build_plant_series() -> list[dict]:
    rnd = mulberry32(7)
    pts = []
    for i in range(96):
        hour = i / 4
        base = 4800 + 1200 * math.sin((hour - 4) * math.pi / 12)
        if 6 < hour < 14:
            base += 600
        if 14 < hour < 22:
            base += 300
        if abs(hour - 6) < 0.3 or abs(hour - 14) < 0.3 or abs(hour - 22) < 0.3:
            base -= 1100
        actual = base + (rnd() - 0.5) * 280
        predicted = base + (rnd() - 0.5) * 110
        pts.append({"t": i, "hour": hour, "actual": int(actual), "predicted": int(predicted)})
    return pts


def build_history() -> list[dict]:
    rnd = mulberry32(11)
    days = []
    now = date(2026, 5, 24)
    for i in range(13, -1, -1):
        d = now - timedelta(days=i)
        weekend = d.weekday() >= 5
        base = 92_000 if weekend else 118_000
        actual = base + (rnd() - 0.5) * 7000
        predicted = base + (rnd() - 0.5) * 2400
        production = actual / (1.7 + rnd() * 0.4)
        days.append({
            "date": d.isoformat(),
            "label": f"{d.month}/{d.day}",
            "kwh": int(actual),
            "predicted": int(predicted),
            "kg": int(production),
            "kwhPerKg": round(actual / production, 2),
            "anomalies": int(rnd() * (2 if weekend else 5)),
        })
    return days


def build_shift_history() -> list[dict]:
    rnd = mulberry32(23)
    out = []
    now = date(2026, 5, 24)
    letters = ["A", "B", "C"]
    for i in range(13, -1, -1):
        d = now - timedelta(days=i)
        weekend = d.weekday() >= 5
        for j, L in enumerate(letters):
            base = 30_800 if weekend else 39_400
            energy = int(base + (rnd() - 0.5) * 2800 - (2400 if L == "C" else 0))
            runtime = round(7.1 + rnd() * 0.85 - (0.3 if L == "C" else 0), 2)
            output = int(energy / (1.55 + rnd() * 0.4))
            is_current = (i == 0 and L == "B")
            sources = ["plc", "plc", "plc", "plc", "plc", "xlsx", "plc"]
            source = "plc-live" if is_current else sources[int(rnd() * len(sources))]
            start = "06:00" if L == "A" else ("14:00" if L == "B" else "22:00")
            end   = "14:00" if L == "A" else ("22:00" if L == "B" else "06:00")
            out.append({
                "id": f"{d.isoformat()}-{L}",
                "date": d.isoformat(),
                "dateLabel": f"{d.month:02d}/{d.day:02d}",
                "shift": L,
                "start": start,
                "end": end,
                "runtime_h": round(runtime * 0.55, 2) if is_current else runtime,
                "energy_kwh": int(energy * 0.55) if is_current else energy,
                "output_kg": int(output * 0.55) if is_current else output,
                "kwh_per_kg": None if is_current else round(energy / output, 2),
                "anomalies": int(rnd() * (2 if weekend else 4)),
                "partial": is_current,
                "source": source,
            })
    return out


def build_machine_series(seed: int) -> list[dict]:
    rnd = mulberry32(seed)
    pts = []
    for i in range(96):
        hour = i / 4
        rpm = 9400 + math.sin(hour * 0.5) * 140 + (rnd() - 0.5) * 80
        kw = (rpm / 9400) * 13 + (rnd() - 0.5) * 1.2
        if (5.8 < hour < 6.1) or (11.6 < hour < 12.0) or (17.5 < hour < 17.9):
            rpm *= 0.35
            kw *= 0.4
        pts.append({"t": i, "hour": round(hour, 4), "rpm": int(rpm), "kw": round(kw, 2)})
    return pts


def build_backfill_map() -> dict:
    rnd = mulberry32(101)
    start = date(2026, 5, 8)
    dates = []
    for i in range(7):
        d = start + timedelta(days=i)
        dates.append({
            "date": d.isoformat(),
            "label": f"{d.month:02d}/{d.day:02d}",
            "weekday": ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.weekday() + 1 if d.weekday() < 6 else 0],
        })
    # weekday() returns 0=Mon…6=Sun; JS getDay() returns 0=Sun…6=Sat
    # recalculate properly
    days_js = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    for entry in dates:
        d = date.fromisoformat(entry["date"])
        entry["weekday"] = days_js[(d.weekday() + 1) % 7]

    grid = []
    for di, d in enumerate(dates):
        for L in ["A", "B", "C"]:
            r = rnd()
            if di == 3 and L == "C":
                status = "new"
            elif di == 5 and L == "A":
                status = "conflict-xlsx"
            elif di == 6 and L == "B":
                status = "partial"
            elif r < 0.08:
                status = "new"
            elif r < 0.18:
                status = "conflict-xlsx"
            elif r < 0.28:
                status = "partial"
            else:
                status = "conflict-plc"

            machines_in_file = 41 if status == "partial" else 64
            machines_existing = (0 if status == "new" else
                                  41 if status == "partial" else 64)
            resolution = ("insert" if status == "new" else
                          "skip"      if status == "conflict-plc" else
                          "overwrite" if status == "conflict-xlsx" else
                          "merge")
            grid.append({
                "id": f"{d['date']}-{L}",
                "date": d["date"],
                "dateLabel": d["label"],
                "weekday": d["weekday"],
                "shift": L,
                "status": status,
                "rows_in_file": machines_in_file,
                "rows_in_db": machines_existing,
                "resolution": resolution,
            })
    return {"dates": dates, "grid": grid}


# ── Static datasets ───────────────────────────────────────────────────────────

RECOMMENDATIONS = [
    {"id":"R-2419","machine":"TFO-027","title":"Reduce spindle speed 9 800 → 9 200 RPM",
     "detail":"Current twist quality margin is +14%. Speed reduction holds TPI within spec and cuts draw on motor.",
     "savings_kwh":184,"savings_pct":11.2,"confidence":0.91,"horizon":"per day","category":"speed"},
    {"id":"R-2418","machine":"Line B (16 machines)","title":"Shift maintenance window to 02:00–04:30",
     "detail":"Demand baseline is 38% lower in this window vs current 14:00 window. Overlap with off-peak tariff.",
     "savings_kwh":612,"savings_pct":4.8,"confidence":0.86,"horizon":"per week","category":"schedule"},
    {"id":"R-2416","machine":"TFO-041","title":"Re-cluster from group D → C",
     "detail":"Idle-loss has dropped 22% since spindle bearing change. Move to cluster C for tighter monitoring thresholds.",
     "savings_kwh":47,"savings_pct":2.1,"confidence":0.78,"horizon":"per day","category":"cluster"},
    {"id":"R-2415","machine":"TFO-012, TFO-013, TFO-019","title":"Stagger doff cycles to flatten 14:00 peak",
     "detail":"Three machines currently doffing within 8 min of each other adds 1.4 MW spike. Stagger to 20-min offsets.",
     "savings_kwh":96,"savings_pct":1.6,"confidence":0.83,"horizon":"per day","category":"schedule"},
    {"id":"R-2412","machine":"TFO-053","title":"Idle-state lockout after 9 min",
     "detail":"Spindle drive remains energized during operator breaks. Auto-shutoff would save 31 kWh/day.",
     "savings_kwh":31,"savings_pct":3.4,"confidence":0.94,"horizon":"per day","category":"idle"},
    {"id":"R-2410","machine":"Plant-wide","title":"Pre-heat coolant loop on demand, not schedule",
     "detail":"Current scheduled pre-heat runs 04:30 daily. Model predicts demand peak shifted 35 min later this month.",
     "savings_kwh":220,"savings_pct":0.9,"confidence":0.71,"horizon":"per day","category":"schedule"},
]

ANOMALIES = [
    {"id":"A-8814","time":"14:32","machine":"TFO-027","severity":"high","kind":"Energy draw +28% over baseline","status":"open"},
    {"id":"A-8813","time":"13:51","machine":"TFO-041","severity":"med", "kind":"Spindle RPM oscillation (σ 142 rpm)","status":"open"},
    {"id":"A-8812","time":"13:04","machine":"TFO-019","severity":"low", "kind":"Idle dwell exceeded 12 min","status":"ack"},
    {"id":"A-8811","time":"12:48","machine":"TFO-053","severity":"high","kind":"kWh/kg 2.4× cluster median","status":"open"},
    {"id":"A-8810","time":"11:22","machine":"TFO-008","severity":"med", "kind":"Power factor below 0.81","status":"open"},
    {"id":"A-8809","time":"10:14","machine":"TFO-061","severity":"low", "kind":"Tension sensor drift (calibration due)","status":"resolved"},
    {"id":"A-8808","time":"09:33","machine":"TFO-012","severity":"med", "kind":"Doff cycle 38% over expected duration","status":"ack"},
    {"id":"A-8807","time":"08:59","machine":"TFO-033","severity":"low", "kind":"Yarn break rate +60% vs 7-day avg","status":"resolved"},
    {"id":"A-8806","time":"07:42","machine":"TFO-027","severity":"med", "kind":"Motor temp 78°C (warn at 75°C)","status":"resolved"},
]

MODEL_RUNS = [
    {"id":"v2026.05.21-3","date":"21 May 2026 04:12","mape":3.41,"rmse":218,"status":"deployed",
     "rows":4_181_204,"params":"Gradient Boosted Trees · 180 est. · depth 6",
     "sources":{"plc":0.84,"xlsx":0.12,"manual":0.04},
     "uploads":["UP-0241","UP-0240","UP-0239","UP-0238"],"training_window":"21 Apr – 20 May"},
    {"id":"v2026.05.14-2","date":"14 May 2026 04:08","mape":3.78,"rmse":244,"status":"archived",
     "rows":3_988_111,"params":"Gradient Boosted Trees · 160 est. · depth 6",
     "sources":{"plc":0.87,"xlsx":0.11,"manual":0.02},
     "uploads":["UP-0234","UP-0233","UP-0232"],"training_window":"14 Apr – 13 May"},
    {"id":"v2026.05.07-1","date":"07 May 2026 04:05","mape":4.02,"rmse":261,"status":"archived",
     "rows":3_811_540,"params":"Gradient Boosted Trees · 160 est. · depth 5",
     "sources":{"plc":0.82,"xlsx":0.14,"manual":0.04},
     "uploads":["UP-0228","UP-0227"],"training_window":"07 Apr – 06 May"},
    {"id":"v2026.04.30-2","date":"30 Apr 2026 04:14","mape":4.19,"rmse":274,"status":"archived",
     "rows":3_644_780,"params":"Random Forest · 120 est. · depth 8",
     "sources":{"plc":0.76,"xlsx":0.22,"manual":0.02},
     "uploads":["UP-0221","UP-0220","UP-0219"],"training_window":"31 Mar – 29 Apr"},
]

FEATURES = [
    {"name":"spindle_rpm","importance":0.31},
    {"name":"runtime_hours_24h","importance":0.24},
    {"name":"yarn_denier","importance":0.13},
    {"name":"ambient_temp_c","importance":0.08},
    {"name":"spindle_count","importance":0.07},
    {"name":"twist_multiplier","importance":0.06},
    {"name":"doff_count_24h","importance":0.05},
    {"name":"machine_age_years","importance":0.03},
    {"name":"shift_id","importance":0.02},
    {"name":"humidity_pct","importance":0.01},
]

CLUSTERS = [
    {"id":"A","label":"Tier-1 efficient",  "count":14,"kwhPerKg":1.18,"color":"#222"},
    {"id":"B","label":"Steady performers", "count":22,"kwhPerKg":1.41,"color":"#555"},
    {"id":"C","label":"Watch list",        "count":18,"kwhPerKg":1.72,"color":"#888"},
    {"id":"D","label":"Underperformers",   "count":10,"kwhPerKg":2.18,"color":"#bbb"},
]

UPLOAD_LOG = [
    {"id":"UP-0241","file":"shift_2026-05-20.xlsx",    "rows":192, "date":"20 May 2026 23:08","user":"n.agarwal","status":"committed","warnings":0},
    {"id":"UP-0240","file":"shift_2026-05-19.xlsx",    "rows":192, "date":"19 May 2026 23:14","user":"n.agarwal","status":"committed","warnings":2},
    {"id":"UP-0239","file":"backfill_apr_w4.xlsx",     "rows":1344,"date":"18 May 2026 11:22","user":"r.prakash","status":"committed","warnings":0},
    {"id":"UP-0238","file":"shift_2026-05-18.xlsx",    "rows":192, "date":"18 May 2026 23:02","user":"n.agarwal","status":"committed","warnings":0},
    {"id":"UP-0237","file":"shift_2026-05-17_v2.xlsx", "rows":192, "date":"17 May 2026 23:38","user":"n.agarwal","status":"committed","warnings":1},
    {"id":"UP-0236","file":"shift_2026-05-17.xlsx",    "rows":192, "date":"17 May 2026 23:11","user":"n.agarwal","status":"rejected", "warnings":4},
]

UPLOAD_SCHEMA = [
    {"col":"machine_id",      "type":"string","required":True, "example":"TFO-014"},
    {"col":"shift_date",      "type":"date",  "required":True, "example":"2026-05-24"},
    {"col":"shift",           "type":"A|B|C", "required":True, "example":"B"},
    {"col":"runtime_hours",   "type":"number","required":True, "example":"7.42"},
    {"col":"energy_kwh",      "type":"number","required":True, "example":"612.0"},
    {"col":"output_kg",       "type":"number","required":False,"example":"402"},
    {"col":"spindle_rpm_avg", "type":"number","required":False,"example":"9420"},
    {"col":"doff_count",      "type":"number","required":False,"example":"3"},
    {"col":"notes",           "type":"string","required":False,"example":"yarn break ×2 spindle 41"},
]

SAMPLE_PARSED_ROWS = [
    {"machine_id":"TFO-014","shift_date":"2026-05-23","shift":"C","runtime_hours":7.55,"energy_kwh":581.2,"output_kg":388,"spindle_rpm_avg":9380,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-015","shift_date":"2026-05-23","shift":"C","runtime_hours":7.61,"energy_kwh":604.8,"output_kg":401,"spindle_rpm_avg":9420,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-016","shift_date":"2026-05-23","shift":"C","runtime_hours":6.84,"energy_kwh":522.0,"output_kg":344,"spindle_rpm_avg":9180,"doff_count":2,"notes":"operator break 22:40-23:08","_status":"ok"},
    {"machine_id":"TFO-017","shift_date":"2026-05-23","shift":"C","runtime_hours":7.51,"energy_kwh":612.3,"output_kg":398,"spindle_rpm_avg":9410,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-018","shift_date":"2026-05-23","shift":"C","runtime_hours":0.00,"energy_kwh":0.0,  "output_kg":0,  "spindle_rpm_avg":0,   "doff_count":0,"notes":"scheduled maint","_status":"warn","_warn":"zero runtime · maintenance flag detected"},
    {"machine_id":"TFO-019","shift_date":"2026-05-23","shift":"C","runtime_hours":7.43,"energy_kwh":598.1,"output_kg":392,"spindle_rpm_avg":9400,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-020","shift_date":"2026-05-23","shift":"C","runtime_hours":7.58,"energy_kwh":891.4,"output_kg":401,"spindle_rpm_avg":9410,"doff_count":3,"notes":"","_status":"warn","_warn":"energy +47% over 7-shift median · review"},
    {"machine_id":"TFO-021","shift_date":"2026-05-23","shift":"C","runtime_hours":7.49,"energy_kwh":588.7,"output_kg":391,"spindle_rpm_avg":9390,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-022","shift_date":"2026-05-23","shift":"C","runtime_hours":7.61,"energy_kwh":611.0,"output_kg":405,"spindle_rpm_avg":9430,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-023","shift_date":"2026-05-23","shift":"C","runtime_hours":7.36,"energy_kwh":571.4,"output_kg":380,"spindle_rpm_avg":9350,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-024","shift_date":"2026-05-23","shift":"C","runtime_hours":7.54,"energy_kwh":597.2,"output_kg":397,"spindle_rpm_avg":9400,"doff_count":3,"notes":"","_status":"ok"},
    {"machine_id":"TFO-025","shift_date":"2026-05-23","shift":"C","runtime_hours":"—", "energy_kwh":605.0,"output_kg":398,"spindle_rpm_avg":9410,"doff_count":3,"notes":"","_status":"err","_err":"runtime_hours missing · required field"},
]

DB_INFO = {
    "name": "asterope_local.duckdb",
    "path": "/var/asterope/db",
    "size_mb": 412.6,
    "tables": [
        {"name":"shift_facts",       "rows":22_414,    "last_write":"now",     "desc":"shift-level runtime + energy + output per machine"},
        {"name":"anomaly_log",       "rows":1_181,     "last_write":"14:32",   "desc":"ML-flagged anomalies, severity, status"},
        {"name":"model_predictions", "rows":22_414,    "last_write":"06:00",   "desc":"predicted vs actual kWh per shift"},
        {"name":"machines",          "rows":64,        "last_write":"12 May",  "desc":"machine registry + spec"},
        {"name":"uploads",           "rows":241,       "last_write":"20 May",  "desc":"audit log of Excel imports"},
        {"name":"plc_raw_archive",   "rows":4_181_204, "last_write":"now",     "desc":"1-min PLC snapshots (90-day TTL)"},
    ],
}

# Eagerly build the expensive tables once at import time
MACHINES      = build_machines()
PLANT_SERIES  = build_plant_series()
HISTORY       = build_history()
SHIFT_HISTORY = build_shift_history()
BACKFILL      = build_backfill_map()
BACKFILL_META = {
    "file": "backfill_may_w2.xlsx",
    "size_kb": 412.4,
    "range_start": "2026-05-08",
    "range_end":   "2026-05-14",
    "days": 7, "shifts": 21, "machines": 64,
    "total_rows": 1339,
    "parsed_rows": 1339,
    "schema_ok": True,
    "detected": "backfill (multi-day range)",
}
