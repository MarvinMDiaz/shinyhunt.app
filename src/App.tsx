import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TrackerApp } from '@/components/TrackerApp'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { PokemonHuntPage } from '@/pages/PokemonHuntPage'
import { GuidesPage } from '@/pages/GuidesPage'
import { AdminGuard } from '@/components/AdminGuard'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/tracker" element={<TrackerApp />} />
        <Route path="/tracker/*" element={<TrackerApp />} />
        <Route path="/trophy-case" element={<TrackerApp key="trophy-case" />} />
        <Route path="/pokemon/:pokemon-name-shiny-hunt" element={<PokemonHuntPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
