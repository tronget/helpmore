import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <Provider>
    <App />
  </Provider>,
);
