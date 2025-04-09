// Import polyfill for drag-and-drop
import './polyfills/dragDropPolyfill';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
 

import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

console.log('[REAL] Using real API requests');

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
