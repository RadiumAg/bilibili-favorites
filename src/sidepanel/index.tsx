import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from '../popup/Popup'
import '../popup/index.css'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <Popup isSidePanel />
  </React.StrictMode>,
)
