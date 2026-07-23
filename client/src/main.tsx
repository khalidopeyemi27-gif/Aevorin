import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PreferencesProvider } from './core/preferences/PreferencesContext.tsx'
import { WorkspaceStoreProvider } from './core/store/WorkspaceStore.tsx'
import { ToastProvider } from './components/providers/ToastProvider.tsx'
import { NavigationProvider } from './core/navigation/NavigationContext.tsx'
import { supabase } from './components/auth/AuthOverlay.tsx'

// Global fetch interceptor to automatically attach and refresh Supabase JWT for backend requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.includes('/api/')) {
    try {
      let { data: { session } } = await supabase.auth.getSession();
      
      // Auto-refresh token if expired or near expiration (within 60s)
      if (session) {
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        if (expiresAt > 0 && expiresAt - Date.now() < 60000) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            session = refreshData.session;
          }
        }
      }

      if (session?.access_token) {
        config = config || {};
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${session.access_token}`
        };
      }
    } catch (e) {
      console.warn("[Auth Interceptor] Session fetch error:", e);
    }
  }
  
  const response = await originalFetch(resource, config);

  // If backend returns 401 Invalid or expired token, handle stale session gracefully
  if (response.status === 401 && typeof resource === 'string' && resource.includes('/api/')) {
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      if (data?.error === 'Invalid or expired token') {
        console.warn("[Auth Interceptor] Expired token detected. Clearing stale session...");
        await supabase.auth.signOut();
      }
    } catch (e) {}
  }

  return response;
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
