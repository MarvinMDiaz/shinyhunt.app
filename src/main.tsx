import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { UserProfileProvider } from './context/UserProfileContext'

// Canonical domain redirect: www.shinyhunt.app -> shinyhunt.app
// Runs before React renders to ensure immediate redirect
if (typeof window !== 'undefined') {
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  const isRailwayPreview = host.includes('up.railway.app')

  if (!isLocal && !isRailwayPreview && host === 'www.shinyhunt.app') {
    const target =
      'https://shinyhunt.app' +
      window.location.pathname +
      window.location.search +
      window.location.hash

    window.location.replace(target)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <UserProfileProvider>
          <App />
        </UserProfileProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
