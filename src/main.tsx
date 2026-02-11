import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * ARCHITECT // VOID_WEAVER
 * PROTOCOL: MAIN_ENTRY_V2
 * HARDWARE: APPLE_M2_SILICON_OPTIMIZED
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  // CRITICAL_FAILURE: The DOM registry is missing the target node.
  throw new Error("CORE_LOGIC_ERROR: Root element not found. Check index.html.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);