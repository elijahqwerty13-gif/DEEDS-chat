import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with automatic seamless updates
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] New version of DEEDS CHAT available. Auto-updating...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] DEEDS CHAT app shell is cached and ready for offline use.');
      },
      onRegistered(registration) {
        console.log('[PWA] Service Worker registered successfully at:', registration?.scope);
        // Periodically check for updates every 30 minutes
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => {});
          }, 30 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service Worker registration skipped or failed:', error);
      },
    });
  } catch (err) {
    console.warn('[PWA] Registration fallback:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
