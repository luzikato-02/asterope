import type {
  Machine, PlantPoint, HistoryDay, ShiftRecord, Recommendation,
  Anomaly, ModelRun, Feature, Cluster, UploadEntry, SchemaField,
  ParsedRow, BackfillCell, BackfillDate, BackfillMeta, DbInfo, MachinePoint, PlantData,
} from './types'

const TOKEN_KEY = 'asterope_token'

async function get<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { headers })

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchMachines()         { return get<Machine[]>('/api/machines') }
export async function fetchPlantSeries()      { return get<PlantPoint[]>('/api/plant-series') }
export async function fetchHistory()          { return get<HistoryDay[]>('/api/history') }
export async function fetchShiftHistory()     { return get<ShiftRecord[]>('/api/shift-history') }
export async function fetchRecommendations()  { return get<Recommendation[]>('/api/recommendations') }
export async function fetchAnomalies()        { return get<Anomaly[]>('/api/anomalies') }
export async function fetchModelRuns()        { return get<ModelRun[]>('/api/model-runs') }
export async function fetchFeatures()         { return get<Feature[]>('/api/features') }
export async function fetchClusters()         { return get<Cluster[]>('/api/clusters') }
export async function fetchUploadLog()        { return get<UploadEntry[]>('/api/upload-log') }
export async function fetchUploadSchema()     { return get<SchemaField[]>('/api/upload-schema') }
export async function fetchSampleParsedRows() { return get<ParsedRow[]>('/api/sample-parsed-rows') }
export async function fetchDbInfo()           { return get<DbInfo>('/api/db-info') }
export async function fetchMachineSeries(seed: number) {
  return get<MachinePoint[]>(`/api/machine-series/${seed}`)
}
export async function fetchBackfill() {
  return get<{ grid: BackfillCell[]; dates: BackfillDate[]; meta: BackfillMeta }>('/api/backfill')
}

export async function fetchAll(): Promise<PlantData> {
  const [
    machines, plantSeries, history, shiftHistory, recommendations,
    anomalies, modelRuns, features, clusters, uploadLog,
    uploadSchema, sampleParsedRows, backfill, dbInfo,
  ] = await Promise.all([
    fetchMachines(), fetchPlantSeries(), fetchHistory(), fetchShiftHistory(),
    fetchRecommendations(), fetchAnomalies(), fetchModelRuns(), fetchFeatures(),
    fetchClusters(), fetchUploadLog(), fetchUploadSchema(), fetchSampleParsedRows(),
    fetchBackfill(), fetchDbInfo(),
  ])
  return {
    machines, plantSeries, history, shiftHistory, recommendations,
    anomalies, modelRuns, features, clusters, uploadLog,
    uploadSchema, sampleParsedRows, backfill, dbInfo,
  }
}
