import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Roboto font — all weights
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

// Global styles
import './index.css'
import './styles/main.scss'

import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
