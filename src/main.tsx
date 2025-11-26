import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Toaster } from './components/ui/sonner.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { startWorker } = await import('./mocks/browser')
    return startWorker()
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
      <Toaster />
    </ErrorBoundary>
  )
})
