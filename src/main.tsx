import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Import OAuth diagnostics utility (exposes window.diagnoseOAuth)
import './utils/oauthDiagnostics';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
