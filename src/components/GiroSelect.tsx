import { useState, useRef, useEffect } from 'react'
import type { CatalogoItem } from '../types'

interface GiroSelectProps {
  value: string
  onChange: (value: string) => void
  giros: CatalogoItem[]
  showId?: boolean
}

function normalizeGiroValue(value: string): string {
  const sep = ' - '
  if (!value.includes(sep)) return value
  const parts = value.split(sep)
  return parts.slice(1).join(sep).trim()
}

function formatGiro(nombre: string): string {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function GiroSelect({ value, onChange, giros, showId = false }: Readonly<GiroSelectProps>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = giros.filter(g =>
    g.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const normalizedValue = normalizeGiroValue(value)
  const selected = giros.find(g =>
    g.nombre.toLowerCase() === normalizedValue.toLowerCase()
  )
  let displayText = 'Seleccione giro...'
  if (selected) {
    displayText = showId
      ? `${selected.id} - ${formatGiro(selected.nombre)}`
      : formatGiro(selected.nombre)
  } else if (normalizedValue) {
    displayText = formatGiro(normalizedValue)
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-left bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none cursor-pointer flex items-center justify-between">
        <span className={value ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {displayText}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="sticky top-0 bg-white dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 p-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-500 rounded text-sm outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-600 dark:text-gray-100"
              placeholder="Buscar giro..." autoFocus />
          </div>
          <div className="max-h-[375px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
            ) : (
              filtered.map(g => {
                const label = showId
                  ? `${g.id} - ${formatGiro(g.nombre)}`
                  : formatGiro(g.nombre)
                const isSelected = selected?.id === g.id
                return (
                  <button key={g.id} type="button" onClick={() => { onChange(`${g.id} - ${formatGiro(g.nombre)}`); setOpen(false); setSearch('') }}
                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors
                      ${isSelected ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' : 'hover:bg-green-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100'}`}>
                    {label}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
