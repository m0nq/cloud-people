import { StrictMode } from 'react';
import dynamic from 'next/dynamic';
import './index.css';

// Dynamically import App with no SSR to prevent hydration issues
const App = dynamic(() => import('./App'), {
  ssr: false
});

export default function Root() {
  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}
