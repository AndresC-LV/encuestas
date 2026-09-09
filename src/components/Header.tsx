import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface HeaderProps {
  view: 'form' | 'stats'
  onChangeView: (view: 'form' | 'stats') => void
  puedeVerEstadisticas: boolean
}

function Header({ view, onChangeView, puedeVerEstadisticas }: HeaderProps) {
  const { user, logout } = useAuth()
  const { modoOscuro, toggleModo } = useTheme()
  return (
    <header className="shadow-lg text-gray-800 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="flex items-center gap-2 font-bold">
          <span className="logo-texto">
            <img src="/LV_LogoMesa_header.png" alt="" />
          </span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:inline">{user?.nombre}</span>
          <button onClick={toggleModo} title={modoOscuro ? 'Modo Día' : 'Modo Noche'} className="p-1.5 rounded-lg hover:bg-green-600 cursor-pointer">
            {modoOscuro ? '☀️' : '🌙'}
          </button>
          {view === 'stats' ? (
            <button onClick={() => onChangeView('form')} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 cursor-pointer">Encuesta</button>
          ) : (
            puedeVerEstadisticas && (
              <button onClick={() => onChangeView('stats')} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 cursor-pointer">
                Estadísticas
              </button>
            )
          )}
          <button onClick={logout} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 cursor-pointer">Salir</button>
        </div>
      </div>
    </header>
  )
}
export default Header;