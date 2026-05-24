export interface Machine {
  id: string
  line: string
  status: 'running' | 'idle' | 'doff' | 'fault' | 'maint'
  spindles: number
  yarn: string
  denier: number
  ply: number
  rpm: number
  tpi: number
  twistMultiplier: number
  kw: number
  kwh24: number
  runtime24: number
  efficiency: number
  cluster: 'A' | 'B' | 'C' | 'D'
  kwhPerKg: number
  doffsToday: number
  commissioned: number
}

export interface PlantPoint {
  t: number
  hour: number
  actual: number
  predicted: number
}

export interface HistoryDay {
  date: string
  label: string
  kwh: number
  predicted: number
  kg: number
  kwhPerKg: number
  anomalies: number
}

export interface ShiftRecord {
  id: string
  date: string
  dateLabel: string
  shift: 'A' | 'B' | 'C'
  start: string
  end: string
  runtime_h: number
  energy_kwh: number
  output_kg: number
  kwh_per_kg: number | null
  anomalies: number
  partial: boolean
  source: string
}

export interface Recommendation {
  id: string
  machine: string
  title: string
  detail: string
  savings_kwh: number
  savings_pct: number
  confidence: number
  horizon: string
  category: string
}

export interface Anomaly {
  id: string
  time: string
  machine: string
  severity: 'high' | 'med' | 'low'
  kind: string
  status: 'open' | 'ack' | 'resolved'
}

export interface ModelRun {
  id: string
  date: string
  mape: number
  rmse: number
  status: 'deployed' | 'archived'
  rows: number
  params: string
  sources: { plc: number; xlsx: number; manual: number }
  uploads: string[]
  training_window: string
}

export interface Feature {
  name: string
  importance: number
}

export interface Cluster {
  id: string
  label: string
  count: number
  kwhPerKg: number
  color: string
}

export interface UploadEntry {
  id: string
  file: string
  rows: number
  date: string
  user: string
  status: 'committed' | 'rejected'
  warnings: number
}

export interface SchemaField {
  col: string
  type: string
  required: boolean
  example: string
}

export interface ParsedRow {
  machine_id: string
  shift_date: string
  shift: string
  runtime_hours: number | string
  energy_kwh: number
  output_kg: number
  spindle_rpm_avg: number
  doff_count: number
  notes: string
  _status: 'ok' | 'warn' | 'err'
  _warn?: string
  _err?: string
}

export interface BackfillCell {
  id: string
  date: string
  dateLabel: string
  weekday: string
  shift: 'A' | 'B' | 'C'
  status: 'new' | 'conflict-plc' | 'conflict-xlsx' | 'partial'
  rows_in_file: number
  rows_in_db: number
  resolution: 'insert' | 'skip' | 'overwrite' | 'merge'
}

export interface BackfillDate {
  date: string
  label: string
  weekday: string
}

export interface BackfillMeta {
  file: string
  size_kb: number
  range_start: string
  range_end: string
  days: number
  shifts: number
  machines: number
  total_rows: number
  parsed_rows: number
  schema_ok: boolean
  detected: string
}

export interface DbTable {
  name: string
  rows: number
  last_write: string
  desc: string
}

export interface DbInfo {
  name: string
  path: string
  size_mb: number
  tables: DbTable[]
}

export interface MachinePoint {
  t: number
  hour: number
  rpm: number
  kw: number
}

export interface PlantData {
  machines: Machine[]
  plantSeries: PlantPoint[]
  history: HistoryDay[]
  shiftHistory: ShiftRecord[]
  recommendations: Recommendation[]
  anomalies: Anomaly[]
  modelRuns: ModelRun[]
  features: Feature[]
  clusters: Cluster[]
  uploadLog: UploadEntry[]
  uploadSchema: SchemaField[]
  sampleParsedRows: ParsedRow[]
  backfill: { grid: BackfillCell[]; dates: BackfillDate[]; meta: BackfillMeta }
  dbInfo: DbInfo
}
