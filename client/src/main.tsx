import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
