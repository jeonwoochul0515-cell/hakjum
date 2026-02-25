import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WizardProvider } from '@/context/WizardContext'
import { FlowProvider } from '@/context/FlowContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WizardProvider>
        <FlowProvider>
          <App />
        </FlowProvider>
      </WizardProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Service Worker 등록 + 자동 업데이트
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // 새 SW가 대기 중이면 즉시 활성화
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // 새 SW 활성화되면 페이지 리로드하여 구 캐시 에셋 문제 해결
            window.location.reload();
          }
        });
      });
      // 수동으로 업데이트 체크
      reg.update().catch(() => {});
    }).catch(() => {});
  });
}
