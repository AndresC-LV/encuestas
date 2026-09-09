import { supabaseUrl, supabaseServiceKey } from '../../lib/supabase'

const headers = {
  apikey: supabaseServiceKey,
  Authorization: `Bearer ${supabaseServiceKey}`,
  Accept: 'application/json',
}

async function fetchAll(table: string, select: string, order = 'createdAt') {
  const rows: unknown[] = []
  let from = 0
  const range = 1000
  while (true) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${select}&order=${order}`, {
      headers: { ...headers, Range: `${from}-${from + range - 1}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Error al leer ${table}: ${text}`)
    }
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    rows.push(...data)
    if (data.length < range) break
    from += range
  }
  return rows
}

export async function fetchEstadisticasHorario() {
  const [encuestas, tiposCliente] = await Promise.all([
    fetchAll('encuestas_horario', 'id,nombre,tipoIngreso,extenderHorario,createdAt,puerta,patio,patente,horarioPropuesto,comentarios,createdByUserId'),
    fetchAll('tipo_cliente', 'id,nombre', 'id'),
  ])

  const tipoPorId = Object.fromEntries((tiposCliente as any[]).map((t) => [String(t.id), t.nombre as string]))

  return (encuestas as any[]).map((e) => {
    const tipo = tipoPorId[String(e.tipoIngreso)]?.trim()
    return {
      id: String(e.id),
      nombre: String(e.nombre ?? ''),
      tipoCliente: tipo && tipo !== 'Sin respuesta' ? tipo : 'Sin respuesta',
      extenderHorario: e.extenderHorario ?? null,
      createdAt: e.createdAt,
      puerta: e.puerta ?? '',
      patio: e.patio ?? '',
      patente: e.patente ?? '',
      horarioPropuesto: e.horarioPropuesto ?? '',
      comentarios: e.comentarios ?? '',
      createdByUserId: e.createdByUserId ?? '',
    }
  })
}