/// <reference lib="webworker" />

declare module 'service-worker' {
  // Extend the existing ServiceWorkerGlobalScope interface
  interface CustomServiceWorkerGlobalScope extends ServiceWorkerGlobalScope {
    __WB_MANIFEST: (string | PrecacheEntry)[];
  }

  interface PrecacheEntry {
    url: string;
    revision: string | null;
  }
}

// Instead of redeclaring 'self', extend the existing type
declare global {
  interface WindowEventMap {
    'load': Event;
    'beforeinstallprompt': Event;
  }

  interface Window {
    workbox: {
      precaching: {
        precacheAndRoute: (manifest: any[]) => void;
      };
      routing: {
        registerRoute: (route: any, handler: any) => void;
      };
      strategies: {
        NetworkFirst: new (options?: any) => any;
        CacheFirst: new (options?: any) => any;
        StaleWhileRevalidate: new (options?: any) => any;
      };
    };
    // Don't redeclare serviceWorker, just extend Window interface if needed
    deferredPrompt?: Event;
  }
}

export {}; 