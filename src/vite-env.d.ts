/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STADIA_API_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

