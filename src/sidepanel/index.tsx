import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from '../popup/Popup'
import { scan } from 'react-scan'
import '../popup/index.css'

scan({
  enabled: true,
  log: true, // logs render info to console (default: false)
})
if (import.meta.env.DEV) {
  import('react-grab')
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <Popup isSidePanel />
  </React.StrictMode>,
)
