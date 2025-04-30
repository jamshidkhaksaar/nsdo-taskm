import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';
import './index.css';
import { store } from './store';

// Ensure you have VITE_RECAPTCHA_SITE_KEY in your .env file
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_V3_SITE_KEY';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleReCaptchaProvider>
    </Provider>
  </React.StrictMode>
); 