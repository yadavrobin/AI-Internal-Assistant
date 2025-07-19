import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Import pages (simplified)
import LoginPage from './pages/LoginPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import LoadingPage from './pages/LoadingPage.jsx';

// Import components
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Create Material-UI theme with modern aesthetic design
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Beautiful blue
      light: '#60a5fa', // Lighter blue
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#8b5cf6', // Purple accent
      light: '#a78bfa',
      dark: '#6d28d9',
    },
    success: {
      main: '#10b981', // Emerald green
    },
    warning: {
      main: '#f59e0b', // Amber
    },
    error: {
      main: '#ef4444', // Red
    },
    background: {
      default: '#1a1d29', // Softer dark blue-gray
      paper: '#252836', // Warmer dark paper
    },
    text: {
      primary: '#ffffff', // Pure white for better contrast
      secondary: '#b8bcc8', // Softer gray
    },
    divider: '#3a3f4f', // Warmer divider
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#f8fafc',
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      color: '#f8fafc',
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 500,
      color: '#f8fafc',
      letterSpacing: '-0.025em',
    },
    body1: {
      color: '#e2e8f0',
      lineHeight: 1.6,
    },
    body2: {
      color: '#cbd5e1',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#262626',
          border: '1px solid #404040',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#404040',
            },
            '&:hover fieldset': {
              borderColor: '#606060',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f4f4f4',
            },
          },
        },
      },
    },
  },
});

const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isAuthenticated && <Navbar />}
      
      <Box sx={{ flex: 1, display: 'flex' }}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/chat" />} 
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 route */}
          <Route path="*" element={<Navigate to="/chat" />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
