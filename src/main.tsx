import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/themes.css';
import './styles/components.css';

// PWA Service Worker registration (handled by vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Новая версия ShiftFlow доступна.');
  },
  onOfflineReady() {
    console.log('ShiftFlow готов к работе офлайн.');
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

