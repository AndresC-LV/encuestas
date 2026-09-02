export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string

async function supabaseFetch(table: string, query: string, options: { method?: string; body?: unknown } = {}) {
  const url = `${supabaseUrl}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function list(table: string, select: string, order?: string) {
  const qs = `select=${encodeURIComponent(select)}${order ? `&order=${encodeURIComponent(order)}` : ''}`
  return supabaseFetch(table, qs)
}

export async function create(table: string, data: unknown, select: string) {
  return supabaseFetch(table, `select=${encodeURIComponent(select)}`, { method: 'POST', body: data })
}
