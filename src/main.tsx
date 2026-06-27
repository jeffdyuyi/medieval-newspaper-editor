import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { NewspaperProvider } from './context/NewspaperContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NewspaperProvider>
      <App />
    </NewspaperProvider>
  </StrictMode>,
);
