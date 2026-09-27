import './lib/charts';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';
import { queryClient } from './lib/queryClient';
import { MemphisBackground } from './components/decor/MemphisBackground';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <ThemeProvider>
    <MemphisBackground />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>,
);
