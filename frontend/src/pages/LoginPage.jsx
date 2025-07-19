import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';

const LoginPage = () => {
  const { loginWithGoogle, loading, error } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Enterprise Knowledge Assistant
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Access your company's knowledge base with AI-powered search and assistance
          </Typography>

          {error && (
            <Card sx={{ mb: 3, bgcolor: 'error.light' }}>
              <CardContent>
                <Typography color="error.contrastText">
                  {error}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={loginWithGoogle}
            disabled={loading}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            Use your company Google account to access the knowledge base
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
