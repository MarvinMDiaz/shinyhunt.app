import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TrackerApp } from '@/components/TrackerApp'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { HomePage } from '@/pages/HomePage'
import { AdminDashboard } from '@/pages/AdminDashboard'
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

// Debug: Log when App renders
console.log('App component rendered')

export default App
