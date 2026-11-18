import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Build-time SEO content is served outside the React root for crawler visibility.
// Remove it before the existing app mounts so React remains the sole interactive UI.
document.getElementById('seo-static-content')?.remove();

// Route content is mounted asynchronously. Keep the browser from restoring a
// stale page position while the new route is being mounted.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Remove the site's obsolete offline worker and only its own caches. This is
// intentionally non-blocking so it cannot delay the first render.
if ('serviceWorker' in navigator) {
  void (async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const scriptUrl = registration.active?.scriptURL
            || registration.installing?.scriptURL
            || registration.waiting?.scriptURL;
          return scriptUrl
            ? new URL(scriptUrl).origin === window.location.origin
              && new URL(scriptUrl).pathname.endsWith('/sw.js')
            : false;
        })
        .map((registration) => registration.unregister())
    );

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('fastpointcab-'))
        .map((cacheName) => caches.delete(cacheName))
    );
  })().catch(() => {
    // Storage or service-worker cleanup can be unavailable in restricted contexts.
  });
}
