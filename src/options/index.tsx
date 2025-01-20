import React from 'react'
import ReactDOM from 'react-dom/client'
import Options from './Options'
import './index.css'
import { scan } from 'react-scan'
import { Toaster } from '@/components/ui/toaster'

scan({
  enabled: true,
  log: true, // logs render info to console (default: false)
})

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <Options />
    <Toaster />
  </React.StrictMode>,
)
