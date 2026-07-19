import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PreferencesProvider } from './core/preferences/PreferencesContext.tsx'
import { WorkspaceStoreProvider } from './core/store/WorkspaceStore.tsx'
import { ToastProvider } from './components/providers/ToastProvider.tsx'
import { NavigationProvider } from './core/navigation/NavigationContext.tsx'
import { supabase } from './components/auth/AuthOverlay.tsx'

// Global fetch interceptor to automatically attach Supabase JWT to backend requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.includes('/api/')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${session.access_token}`
      };
    }
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavigationProvider>
      <PreferencesProvider>
        <WorkspaceStoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </WorkspaceStoreProvider>
      </PreferencesProvider>
    </NavigationProvider>
  </StrictMode>,
)
