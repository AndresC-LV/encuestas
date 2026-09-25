import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabaseUrl, supabaseServiceKey } from '../lib/supabase'

interface FoodServiceRow {
  id: string
  nombre: string | null
  email: string | null
  telefono: string | null
  empresa: string | null
  created_at: string
}

export default function FoodServiceGrilla() {
  const [rows, setRows] = useState<FoodServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 30

  const fetchRows = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/food_service?select=id,nombre,email,telefono,empresa,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            Accept: 'application/json',
          },
        }
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  const exportExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        id: r.id,
        nombre: r.nombre || '',
        email: r.email || '',
        telefono: r.telefono || '',
        empresa: r.empresa || '',
        created_at: r.created_at ? new Date(r.created_at).toLocaleString('es-CL') : '',
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'FoodService')
    XLSX.writeFile(wb, `foodservice_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [rows])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages))

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">FoodService</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total registros: {rows.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRows}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Actualizar
          </button>
          <button
            onClick={exportExcel}
            disabled={rows.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            Descargar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <p className="text-gray-500 dark:text-gray-400">No hay registros FoodService.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">ID</th>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Teléfono</th>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Empresa</th>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {pageRows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">{r.id}</td>
                  <td className="px-3 py-2">{r.nombre || '—'}</td>
                  <td className="px-3 py-2">{r.email || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.telefono || '—'}</td>
                  <td className="px-3 py-2">{r.empresa || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleString('es-CL') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {(currentPage - 1) * PER_PAGE + 1}-{Math.min(currentPage * PER_PAGE, rows.length)} de {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-200">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
