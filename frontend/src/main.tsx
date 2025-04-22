import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppRoutes } from './routes';

const router = createBrowserRouter(AppRoutes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
}); 