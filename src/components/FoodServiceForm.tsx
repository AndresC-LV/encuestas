import { useState } from 'react'
import { supabaseUrl, supabaseServiceKey } from '../lib/supabase'

export default function FoodServiceForm() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailTrim = email.trim()
    const faltantes: string[] = []
    if (!nombre.trim()) faltantes.push('Nombre')
    if (!emailTrim) faltantes.push('Email')
    else if (!validateEmail(emailTrim)) {
      setError('Email inválido')
      setTimeout(() => setError(''), 4000)
      return
    }
    if (!empresa.trim()) faltantes.push('Empresa')
    if (faltantes.length > 0) {
      setError(`Campos obligatorios: ${faltantes.join(', ')}`)
      setTimeout(() => setError(''), 4000)
      return
    }
    const telDigits = telefono.replace(/\D/g, '')
    if (telDigits.length > 0 && telDigits.length !== 9) {
      setError('Teléfono debe tener 9 dígitos')
      setTimeout(() => setError(''), 4000)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/food_service`, {
        method: 'POST',
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          nombre: nombre.trim() || null,
          email: emailTrim ? emailTrim.toLowerCase() : null,
          telefono: telefono.trim() ? `+56 ${telefono.trim()}` : null,
          empresa: empresa.trim() || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setToast('Contacto FoodService registrado correctamente')
      setTimeout(() => setToast(''), 3000)
      setNombre('')
      setEmail('')
      setTelefono('')
      setEmpresa('')
    } catch (err: any) {
      setError(err?.message || 'Error al guardar')
      setTimeout(() => setError(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-4 lg:mt-10 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">FoodService</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Formulario de contacto FoodService</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre (contacto) *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="Nombre del contacto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-l-lg select-none">+56</span>
              <input
                type="tel"
                value={telefono}
                maxLength={11}
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9 ]/g, '')
                  const digits = v.replace(/\D/g, '').slice(0, 9)
                  // re-formateo simple: 9 XXXX XXXX si son 9 digitos, sino deja como está
                  if (digits.length <= 1) v = digits
                  else if (digits.length <= 5) v = `${digits.slice(0, 1)} ${digits.slice(1)}`
                  else v = `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`
                  setTelefono(v.trimStart())
                }}
                placeholder="9 1234 5678"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg rounded-l-none text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa *</label>
            <input
              type="text"
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="Nombre empresa"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">{toast}</div>}
    </div>
  )
}
