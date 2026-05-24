interface LoginResponse {
  step:  'totp-verify' | 'totp-setup'
  token: string
}

interface TotpSetupData {
  secret:    string
  uri:       string
  qr_base64: string
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `${res.status}`)
  return json as T
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `${res.status}`)
  return json as T
}

export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', { username, password })
}

export async function apiGetTotpSetup(partialToken: string): Promise<TotpSetupData> {
  return get<TotpSetupData>('/api/auth/setup-totp', partialToken)
}

export async function apiConfirmTotpSetup(code: string, partialToken: string): Promise<{ token: string }> {
  return post<{ token: string }>('/api/auth/setup-totp', { code }, partialToken)
}

export async function apiVerifyTotp(code: string, partialToken: string): Promise<{ token: string }> {
  return post<{ token: string }>('/api/auth/verify-totp', { code }, partialToken)
}
