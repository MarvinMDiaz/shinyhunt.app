import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { UserProfileProvider } from './context/UserProfileContext'
// Import production console guard first to protect against accidental logging
import './lib/productionConsoleGuard'

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
