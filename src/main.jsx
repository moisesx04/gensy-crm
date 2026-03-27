import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import './index.css';
import App from './App.jsx';

import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb', margin: 20, borderRadius: 8 }}>
          <h2>System Error (G A FRIAS)</h2>
          <p>The system failed to start. Error detail:</p>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: 10, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', cursor: 'pointer' }}>Refresh System</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <SearchProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SearchProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg error:', err));
  });
}
