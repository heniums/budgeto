import './lib/charts';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';
import { MemphisBackground } from './components/decor/MemphisBackground';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <ThemeProvider>
    <MemphisBackground />
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>,
);
