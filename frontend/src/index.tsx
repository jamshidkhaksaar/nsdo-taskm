// Import polyfill for drag-and-drop
// import './polyfills/dragDropPolyfill';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import { stagewiseConfig } from './config/stagewise';

console.log('[REAL] Using real API requests');

const queryClient = new QueryClient();

// Create a separate root for the stagewise toolbar in development mode
if (process.env.NODE_ENV === 'development') {
  const toolbarRoot = document.createElement('div');
  toolbarRoot.id = 'stagewise-toolbar-root';
  document.body.appendChild(toolbarRoot);
  
  ReactDOM.createRoot(toolbarRoot).render(
    <StagewiseToolbar config={stagewiseConfig} />
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
