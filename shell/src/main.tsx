import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initSingleSpa } from './app/microfrontends/singleSpaConfig';
import { registerServiceWorker } from './sw/registerServiceWorker';

// Iniciar el orquestador single-spa y registrar PWA Service Worker
initSingleSpa();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
