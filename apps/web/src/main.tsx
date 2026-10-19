import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/app';
import { i18nReady } from './lib/i18n';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Spanish is bundled, so this only waits when the saved language must be fetched first.
void i18nReady.finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
