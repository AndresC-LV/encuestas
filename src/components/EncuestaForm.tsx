import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'    
import type { CatalogoItem } from '../types';
import { list, supabaseServiceKey, supabaseUrl } from '../lib/supabase';
import { GiroSelect } from './GiroSelect';
import { SearchSelect } from './SearchSelect';

const formatName = (name: string) => name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name

function EncuestaForm() {
  const [sectorPuerta, setSectorPuerta] = useState("");
  const [puerta, setPuerta] = useState('')
  const [patio, setPatio] = useState('')
  const [region, setRegion] = useState('13')
  const [comunaid, setComunaid] = useState('')
  const [sectores, setSectores] = useState<CatalogoItem[]>([])
  const [puertas, setPuertas] = useState<CatalogoItem[]>([])
  const [comunas, setComunas] = useState<CatalogoItem[]>([])
  const [regiones, setRegiones] = useState<CatalogoItem[]>([])
  const [giros, setGiros] = useState<CatalogoItem[]>([])
  const [tiposCliente, setTiposCliente] = useState<CatalogoItem[]>([])
  const [nombre, setNombre] = useState('')
  const [tipoIngreso, setTipoIngreso] = useState('')
  const [patente, setPatente] = useState('')
  const [extenderHorario, setExtenderHorario] = useState<boolean | null>(null)
  const [nuevoHorario, setNuevoHorario] = useState('')
  const [giro, setGiro] = useState('')
  const [comentarios, setComentarios] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [kpi, setKpi] = useState({ total: 0, siExtenderHorario: 0, noExtenderHorario: 0, fechaInicio: null as string | null })
  const { user } = useAuth()
  

  async function fetchKpi() {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/encuestas_horario?select=extenderHorario,createdAt&order=createdAt.asc`, { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } })
      if (!res.ok) return
      const data = await res.json()
      const total = data.length
      const siExtenderHorario = data.filter((r: any) => r.extenderHorario === true).length
      const noExtenderHorario = data.filter((r: any) => r.extenderHorario === false || r.extenderHorario === null).length
      const fechaInicio = data.length > 0 ? data[0].createdAt : null
      setKpi({ total, siExtenderHorario, noExtenderHorario, fechaInicio })
    } catch {}
  }

  useEffect(() => {
    async function load() {
      try {
        const headers = { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } as any
        const fetchService = async (table: string, select: string, order = 'nombre.asc') => {
          const r = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${select}&order=${order}`, { headers })
          return r.ok ? r.json() : []
        }
        const [sectoresData, puertasData, comunasData, regionesData, girosData, tiposClienteData] = await Promise.all([
          list('sector', 'id,name', 'name.asc').catch(() => []),
          fetchService('tipo_puerta', 'id,nombre').catch(() => []),
          fetchService('comunas', 'id,id_region,nombre_comuna', 'nombre_comuna.asc').catch(() => []),
          fetchService('regiones', 'id,nombre', 'id.asc').catch(() => []),
          fetchService('tipo_giro', 'id,nombre_giro', 'id.asc').catch(() => []),
          fetchService('tipo_cliente', 'id,nombre').catch(() => []),
        ])
        setSectores((sectoresData ?? []).filter((s: any) => s.id !== 0).map((s: any) => ({ id: s.id, nombre: s.name })))
        setPuertas((puertasData ?? []).map((p: any) => ({ id: p.id, nombre: p.nombre })))
        setComunas((comunasData ?? []).map((c: any) => ({ id: c.id, id_region: c.id_region, nombre: c.nombre_comuna } as any)))
        setRegiones((regionesData ?? []).map((r: any) => ({ id: r.id, nombre: r.nombre })))
        setGiros((girosData ?? []).map((g: any) => ({ id: g.id, nombre: g.nombre_giro })))
        setTiposCliente((tiposClienteData ?? []).map((t: any) => ({ id: t.id, nombre: t.nombre })))
      } catch {}
    }
    load()
    fetchKpi()
  }, [])

  useEffect(() => { if (toast) fetchKpi() }, [toast])

  const formEnabled = sectorPuerta === 'sector' ? patio !== '' : puerta !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const faltantes: string[] = []
    if (!puerta && !patio) faltantes.push(sectorPuerta === 'sector' ? 'Sector' : 'Puerta')
    if (!patente) faltantes.push('Patente')
    if (faltantes.length > 0) { setError(`Campos obligatorios: ${faltantes.join(', ')}`); setTimeout(() => setError(''), 5000); return }
    const giroid = giro ? parseInt(giro.split(' - ')[0], 10) : 0
    if (extenderHorario === null) { setError('Debe indicar si desea extender el horario'); setTimeout(() => setError(''), 5000); return }
    if (extenderHorario === true && !nuevoHorario) { setError('Debe seleccionar el horario propuesto'); setTimeout(() => setError(''), 5000); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/encuestas_horario`, {
        method: 'POST',
        headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          puerta: puerta || '', patio: patio || '', nombre: nombre || '', rut: '', email: '', tipoIngreso: tipoIngreso || '',
          telefono: '', patente: patente || '', extenderHorario: extenderHorario, region: region || '',
          comunaid: comunaid ? parseInt(comunaid, 10) : 0, giroid: giroid || 0, horarioPropuesto: nuevoHorario || '', comentarios: comentarios || '', createdByUserId: user?.id || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setToast('Encuesta registrada'); setTimeout(() => setToast(''), 3000)
      setNombre(''); 
      setTipoIngreso(''); 
      setPatente(''); 
      setExtenderHorario(null); 
      setNuevoHorario(''); 
      setRegion('13'); 
      setComunaid(''); 
      setGiro(''); 
      setComentarios('')
    } catch { setError('Error al guardar la encuesta'); setTimeout(() => setError(''), 4000) } finally { setSaving(false) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const pct = (n: number) => (kpi.total > 0 ? Math.round((n / kpi.total) * 100) : 0)

  return (
    <div className="max-w-5xl mx-auto mt-4 lg:mt-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="hidden lg:block text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Encuesta MMLV</h2>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">Encuestas desde: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatDate(kpi.fechaInicio)}</span></p>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-3 lg:mb-4">Total Personas encuestadas: <span className="font-semibold text-gray-700 dark:text-gray-200">{kpi.total}</span></p>
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide mb-2">¿Le Gustaría prolongar horario de cierre?</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-green-700 dark:text-green-300">{kpi.siExtenderHorario}</p>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">{pct(kpi.siExtenderHorario)}%</p>
                  <p className="text-xs text-green-600 dark:text-green-400">👍 Sí</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-red-700 dark:text-red-300">{kpi.noExtenderHorario}</p>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{pct(kpi.noExtenderHorario)}%</p>
                  <p className="text-xs text-red-600 dark:text-red-400">👎 No</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
  <div className="flex items-center gap-4 mb-3">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      ¿Dónde estás ubicado?:
    </span>

    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        name="sectorPuerta"
        checked={sectorPuerta === "sector"}
        onChange={() => {
          setSectorPuerta("sector");
          setPatio("");
          setPuerta("");
        }}
        className="sr-only peer"
      />

      <span className="w-20 px-3 py-1.5 rounded-lg border text-sm font-medium transition text-center peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">
        Sector
      </span>
    </label>

    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        name="sectorPuerta"
        checked={sectorPuerta === "puerta"}
        onChange={() => {
          setSectorPuerta("puerta");
          setPatio("");
          setPuerta("");
        }}
        className="sr-only peer"
      />

      <span className="w-20 px-3 py-1.5 rounded-lg border text-sm font-medium transition text-center peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">
        Puerta
      </span>
    </label>
  </div>

  {/* Solo mostrar el select cuando corresponda */}
  {sectorPuerta === "sector" && (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Sector
      </label>

      <select
        value={patio}
        onChange={(e) => setPatio(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
      >
        <option value="">Seleccione sector...</option>

        {sectores.map((s) => (
          <option key={s.id} value={s.nombre}>
            {formatName(s.nombre)}
          </option>
        ))}
      </select>
    </div>
  )}

  {sectorPuerta === "puerta" && (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Puerta
      </label>

      <select
        value={puerta}
        onChange={(e) => setPuerta(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
      >
        <option value="">Seleccione puerta...</option>

        {puertas.map((p) => (
          <option key={p.id} value={p.nombre}>
            {formatName(p.nombre)}
          </option>
        ))}
      </select>
    </div>
  )}
</div>
            <form onSubmit={handleSubmit} className={`space-y-4 ${!formEnabled ? 'pointer-events-none opacity-50' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patente</label>
                <input type="text" value={patente} maxLength={6} onChange={e => setPatente(e.target.value.toUpperCase())} disabled={!formEnabled} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="ABCD12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Cliente</label>
                <select value={tipoIngreso} onChange={e => setTipoIngreso(e.target.value)} disabled={!formEnabled} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  <option value="">Seleccione tipo cliente...</option>
                  {tiposCliente.map(t => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} disabled={!formEnabled} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giro</label>
                  <GiroSelect value={giro} onChange={setGiro} giros={giros} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Región</label>
                  <SearchSelect value={region} onChange={v => { setRegion(v); setComunaid('') }} items={regiones} placeholder="Seleccione región..." />
                </div>
                <div className={region ? '' : 'opacity-30 pointer-events-none'}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comuna</label>
                  <SearchSelect value={comunaid} onChange={setComunaid} items={region ? comunas.filter(c => (c as any).id_region === parseInt(region)) : []} placeholder="Seleccione comuna..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Le gustaría que se prolongue el horario de cierre del día sábado?</label>
                {extenderHorario === null && <p className="text-xs text-red-400 mb-2">Campo obligatorio</p>}
                <div className="flex gap-3 items-center flex-wrap">
                  <button type="button" onClick={() => { setExtenderHorario(true); setNuevoHorario('') }} disabled={!formEnabled} className={`w-28 px-3 py-2.5 rounded-lg border text-sm font-medium transition cursor-pointer ${extenderHorario === true ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>Sí</button>
                  <button type="button" onClick={() => { setExtenderHorario(false); setNuevoHorario('') }} disabled={!formEnabled} className={`w-28 px-3 py-2.5 rounded-lg border text-sm font-medium transition cursor-pointer ${extenderHorario === false ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>No</button>
                  {extenderHorario === true && (
                    <select value={nuevoHorario} onChange={e => setNuevoHorario(e.target.value)} disabled={!formEnabled} className="flex-1 min-w-[180px] px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100">
                      <option value="">Seleccione horario...</option>
                      <option value="16:00">16:00 hrs</option>
                      <option value="17:00">17:00 hrs</option>
                      <option value="18:00">18:00 hrs</option>
                      <option value="19:00">19:00 hrs</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentarios</label>
                <textarea value={comentarios} onChange={e => setComentarios(e.target.value)} rows={3} disabled={!formEnabled} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-100 resize-none" placeholder="Comentarios adicionales..." />
              </div>
              {error && <div className="fixed bottom-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm">{error} <button onClick={() => setError('')} className="ml-3 cursor-pointer">&times;</button></div>}
              <button type="submit" disabled={saving || !formEnabled} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </form>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  )
}

export default EncuestaForm