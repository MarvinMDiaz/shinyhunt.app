/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_ENV?: string
  // Supabase Configuration
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  // SSO Configuration (add specific provider variables when implementing)
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_CLIENT_SECRET?: string
  readonly VITE_GITHUB_CLIENT_ID?: string
  readonly VITE_GITHUB_CLIENT_SECRET?: string
  readonly VITE_AUTH0_DOMAIN?: string
  readonly VITE_AUTH0_CLIENT_ID?: string
  // Add more SSO provider variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
