import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WizardProvider } from '@/context/WizardContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WizardProvider>
        <App />
      </WizardProvider>
    </BrowserRouter>
  </StrictMode>,
)
