
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './components/LoginPage'
import EncuestaForm from './components/EncuestaForm'
import EstadisticasPage from './components/estadisticas/page'
import FoodServiceForm from './components/FoodServiceForm'
import FoodServiceGrilla from './components/FoodServiceGrilla'
import Header from './components/Header'

type View = 'form' | 'stats' | 'foodservice'

const FOODSERVICE_USER = 'foodservice@lovalledor.cl'

function AppInner() {
  const { isAuthenticated, user } = useAuth()
  const [view, setView] = useState<View>('form')

  const puedeVerEstadisticas = user?.usuario === 'userDev@lovalledor.cl' || user?.usuario === 'czapater@lovalledor.cl'
  const puedeVerFoodService = user?.usuario === FOODSERVICE_USER
  const puedeVerFoodServiceGrilla = user?.usuario === 'userDev@lovalledor.cl' || user?.usuario === 'czapater@lovalledor.cl'

  useEffect(() => {
    if (user?.usuario === FOODSERVICE_USER) setView('foodservice')
    else if (view === 'foodservice' && !puedeVerFoodService && !puedeVerFoodServiceGrilla) setView('form')
  }, [user?.usuario])

  if (isAuthenticated === null) 
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  if (!isAuthenticated) 
    return <LoginPage />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        view={view}
        onChangeView={setView}
        puedeVerEstadisticas={puedeVerEstadisticas}
        puedeVerFoodService={puedeVerFoodService || puedeVerFoodServiceGrilla}
      />

      <main className="flex-1 py-6">
        {view === 'foodservice' ? (
          puedeVerFoodServiceGrilla ? (
            <FoodServiceGrilla />
          ) : puedeVerFoodService ? (
            <FoodServiceForm />
          ) : (
            <EncuestaForm />
          )
        ) : view === 'form' ? (
          <EncuestaForm />
        ) : puedeVerEstadisticas ? (
          <EstadisticasPage />
        ) : (
          <EncuestaForm />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}
