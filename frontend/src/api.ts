const BASE = '/api/v2';
export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE}/${path}`, { ...init, credentials: 'include', cache: 'no-store', headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status, data });
  return data;
}
export function post(path: string, body: unknown) { return api(path, { method: 'POST', body: JSON.stringify(body) }); }
// Legacy demo components remain compilable but are not mounted by the production app.
export const apiFetch = api;
