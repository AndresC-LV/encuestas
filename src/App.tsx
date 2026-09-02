
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './components/LoginPage'
import EncuestaForm from './components/EncuestaForm'
import Header from './components/Header'



function AppInner() {
  const { isAuthenticated } = useAuth()
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
      <Header />
      <main className="flex-1 py-6">
        <EncuestaForm />
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
