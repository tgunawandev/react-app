/// <reference types="vite/client" />

declare global {
  interface Window {
    csrf_token?: string
  }
}

export {}
