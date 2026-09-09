import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { fetchEstadisticasHorario } from '../../api/estadisticas/route'

interface EstadisticaRow {
  id: string
  nombre: string
  tipoCliente: string
  extenderHorario: boolean | null
  createdAt: string
  puerta: string
  patio: string
  patente: string
  createdByUserId: string
  horarioPropuesto: string
  comentarios: string
}

const SIN_RESPUESTA = 'Sin respuesta'

function tipoClienteLabels(rows: EstadisticaRow[]): string[] {
  const set = new Set(
    rows
      .map(r => r.tipoCliente?.trim())
      .filter((v): v is string => Boolean(v) && v !== SIN_RESPUESTA)
  )
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

interface Contingencia {
  columnas: string[]
  filas: Record<string, number | string>[]
  totales: Record<string, number | string>
}

function contingencyToSheetData({ columnas, filas, totales }: Contingencia) {
  const headers = ['Categoría', ...columnas, 'Total']
  const values = [...filas, totales].map(row => [
    row.categoria,
    ...columnas.map(column => row[column]),
    row.total,
  ])
  return [headers, ...values]
}

function buildContingencia(rows: EstadisticaRow[], categorias: string[], matcher: (r: EstadisticaRow, cat: string) => boolean): Contingencia {
  const tipos = tipoClienteLabels(rows)
  const columnas = [...tipos, SIN_RESPUESTA]
  const tipoClienteNormalizado = (r: EstadisticaRow) => r.tipoCliente?.trim() || SIN_RESPUESTA
  const matchCol = (r: EstadisticaRow, col: string) =>
    col === SIN_RESPUESTA ? tipoClienteNormalizado(r) === SIN_RESPUESTA : tipoClienteNormalizado(r) === col
  const filas = categorias.map(cat => {
    const cell: Record<string, number | string> = { categoria: cat }
    columnas.forEach(col => {
      cell[col] = rows.filter(r => matcher(r, cat) && matchCol(r, col)).length
    })
    cell.total = columnas.reduce((sum, col) => sum + (cell[col] as number), 0)
    return cell
  })
  const totales: Record<string, number | string> = { categoria: 'Total' }
  columnas.forEach(col => {
    totales[col] = rows.filter(r => matchCol(r, col)).length
  })
  totales.total = rows.length
  return { columnas, filas, totales }
}

function buildHorarioContingency(rows: EstadisticaRow[]) {
  const categorias = Array.from(new Set(rows.map(r => r.horarioPropuesto).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const matcher = (r: EstadisticaRow, cat: string) => r.horarioPropuesto === cat
  return buildContingencia(rows, categorias, matcher)
}

function buildExtenderHorarioContingency(rows: EstadisticaRow[]) {
  const categorias = ['Sí', 'No']
  const matcher = (r: EstadisticaRow, cat: string) =>
    cat === 'Sí'
      ? r.extenderHorario === true
      : r.extenderHorario === false
  return buildContingencia(rows, categorias, matcher)
}

const EXCEL_COLUMNS: { header: string; key: keyof EstadisticaRow }[] = [
  { header: 'id', key: 'id' },
  { header: 'nombre', key: 'nombre' },
  { header: 'tipo_cliente', key: 'tipoCliente' },
  { header: 'extenderHorario', key: 'extenderHorario' },
  { header: 'createdAt', key: 'createdAt' },
  { header: 'puerta', key: 'puerta' },
  { header: 'patio', key: 'patio' },
  { header: 'patente', key: 'patente' },
  { header: 'horarioPropuesto', key: 'horarioPropuesto' },
  { header: 'comentarios', key: 'comentarios' },
  { header: 'createdByUserId', key: 'createdByUserId' },
]

export default function EstadisticasPage() {
  return <Estadisticas />
}

function Estadisticas() {
  const [rows, setRows] = useState<EstadisticaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  useEffect(() => {
    fetchEstadisticasHorario()
      .then(data => {
        setRows(data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  const exportExcel = useCallback(() => {
    const data = rows.map(r => {
      const extender = r.extenderHorario === true ? 'Sí' : r.extenderHorario === false ? 'No' : 'Sin respuesta'
      return { ...r, extenderHorario: extender }
    })
    const ws = XLSX.utils.json_to_sheet(data.map(r =>
      EXCEL_COLUMNS.reduce<Record<string, unknown>>((acc, c) => {
        acc[c.header] = r[c.key]
        return acc
      }, {})
    ))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Encuestas')
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(contingencyToSheetData(buildHorarioContingency(rows))),
      'Horario por cliente'
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(contingencyToSheetData(buildExtenderHorarioContingency(rows))),
      'Extender horario'
    )
    XLSX.writeFile(wb, 'estadisticas_encuestas.xlsx')
  }, [rows])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const horario = buildHorarioContingency(rows)
  const extenderHorario = buildExtenderHorarioContingency(rows)

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages))

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Estadísticas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de encuestas: {rows.length}</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={rows.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition cursor-pointer"
        >
          Descargar Excel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {rows.length === 0 && !error && (
        <p className="text-gray-500 dark:text-gray-400">No hay encuestas registradas.</p>
      )}

      {rows.length > 0 && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Nuevo horario por tipo de cliente</h2>
            <ContingencyTable columns={horario.columnas} rows={horario.filas} totals={horario.totales} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Extender horario por tipo de cliente</h2>
            <ContingencyTable columns={extenderHorario.columnas} rows={extenderHorario.filas} totals={extenderHorario.totales} />
          </section>
        </>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Detalle de encuestas</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                {EXCEL_COLUMNS.map(c => (
                  <th key={c.header} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {pageRows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">{r.id}</td>
                  <td className="px-3 py-2">{r.nombre}</td>
                  <td className="px-3 py-2">{r.tipoCliente || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.extenderHorario === true ? 'Sí' : r.extenderHorario === false ? 'No' : '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2">{r.puerta}</td>
                  <td className="px-3 py-2">{r.patio}</td>
                  <td className="px-3 py-2">{r.patente}</td>
                  <td className="px-3 py-2">{r.horarioPropuesto || '—'}</td>
                  <td className="px-3 py-2">{r.comentarios || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.createdByUserId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {(currentPage - 1) * PER_PAGE + 1}-{Math.min(currentPage * PER_PAGE, rows.length)} de {rows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-200">Página {currentPage} de {totalPages}</span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

interface ContingencyTableProps {
  columns: string[]
  rows: Record<string, number | string>[]
  totals: Record<string, number | string>
}

function ContingencyTable({ columns, rows, totals }: ContingencyTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Categoría</th>
            {columns.map(c => (
              <th key={c} className="px-4 py-2 text-right font-semibold whitespace-nowrap">{c}</th>
            ))}
            <th className="px-4 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-2 font-medium">{row.categoria}</td>
              {columns.map(c => (
                <td key={c} className="px-4 py-2 text-right">{row[c]}</td>
              ))}
              <td className="px-4 py-2 text-right font-semibold">{row.total}</td>
            </tr>
          ))}
          <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
            <td className="px-4 py-2">{totals.categoria}</td>
            {columns.map(c => (
              <td key={c} className="px-4 py-2 text-right">{totals[c]}</td>
            ))}
            <td className="px-4 py-2 text-right">{totals.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}