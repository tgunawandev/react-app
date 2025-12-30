/**
 * Main App Component - Standalone Version
 * Wraps application with providers and error boundary
 * Connects to Frappe backend at frappe.kodeme.io
 */

import { RouterProvider } from 'react-router-dom';
import { FrappeProvider } from 'frappe-react-sdk';
import { ThemeProvider } from '@/context/theme-provider';
import { Toaster } from '@repo/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ConnectivityBanner from '@/components/ConnectivityBanner';
import { useNotifications } from '@/hooks/useNotifications';
import { router } from '@/router';
import './App.css';

function AppContent() {
  // Enable real-time notifications
  useNotifications();

  return (
    <>
      <ConnectivityBanner />
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}

function App() {
  // Frappe backend URL from environment
  const frappeUrl = import.meta.env.VITE_FRAPPE_URL || 'https://frappe.kodeme.io';

  return (
    <ErrorBoundary>
      <FrappeProvider
        url={frappeUrl}
        enableSocket={true}
        socketPort={443}
      >
        <ThemeProvider defaultTheme="light" storageKey="frm-theme">
          <AppContent />
        </ThemeProvider>
      </FrappeProvider>
    </ErrorBoundary>
  );
}

export default App;
