import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/app';
import { i18nReady } from './lib/i18n';
import { reloadOnce } from './lib/stale-deploy';
import './styles/globals.css';

// A preload of a chunk the new deploy no longer serves: reload into the new version once. If that
// already happened, the error reaches the route error screen instead.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault();
});

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
