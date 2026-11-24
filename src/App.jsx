import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRouter from './routes/AppRouter';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1B2923',
                color: '#FFFFFF',
                border: '1px solid #2C3B34',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#B9F34A',
                  secondary: '#131F00',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF5C5C',
                  secondary: '#2B0000',
                },
              },
            }}
          />
          <AppRouter />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
