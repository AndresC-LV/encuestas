import { useState, useRef, useEffect } from 'react'
import type { CatalogoItem } from '../types'

interface SearchSelectProps {
  value: string
  onChange: (value: string) => void
  items: CatalogoItem[]
  placeholder?: string
}

function formatLabel(nombre: string): string {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function SearchSelect({ value, onChange, items, placeholder = 'Seleccione...' }: SearchSelectProps) {
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

  const filtered = items.filter(item =>
    item.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const selected = items.find(item => `${item.id}` === value)
  const displayText = selected ? formatLabel(selected.nombre) : placeholder

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
              placeholder="Buscar..." autoFocus />
          </div>
          <div className="max-h-[375px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
            ) : (
              filtered.map(item => {
                const label = formatLabel(item.nombre)
                const isSelected = value === `${item.id}`
                return (
                  <button key={item.id} type="button" onClick={() => { onChange(`${item.id}`); setOpen(false); setSearch('') }}
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
