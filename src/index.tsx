import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Buffer } from 'buffer';
import { ThemeProvider } from './components/theme-provider.tsx';
import { seedAccounts } from './lib/storage.ts';
window.Buffer = Buffer;

await seedAccounts();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
    <App />
  </ThemeProvider>
)
