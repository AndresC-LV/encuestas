import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function Header() {
  const { user, logout } = useAuth()
  const { modoOscuro, toggleModo } = useTheme()
  return (
    <header className="bg-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="flex items-center gap-2 font-bold text-lg">Lo Valledor — Encuestas</span>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:inline">{user?.nombre}</span>
          <button onClick={toggleModo} title={modoOscuro ? 'Modo Día' : 'Modo Noche'} className="p-1.5 rounded-lg hover:bg-green-600 cursor-pointer">{modoOscuro ? '☀️' : '🌙'}</button>
          <button onClick={logout} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 cursor-pointer">Salir</button>
        </div>
      </div>
    </header>
  )
}
export default Header;
