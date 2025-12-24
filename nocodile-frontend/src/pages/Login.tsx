import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
      }}
    >
      <Card sx={{ width: 360, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            align="center"
            sx={{ mb: 3, fontWeight: 600, fontSize: '1rem', color: '#333' }}
          >
            Nocodile Admin
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.75rem', py: 0 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="small"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="dense"
              required
              InputProps={{ sx: { fontSize: '0.8rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="dense"
              required
              InputProps={{ sx: { fontSize: '0.8rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, py: 1, fontSize: '0.8rem', textTransform: 'none' }}
            >
              {loading ? <CircularProgress size={20} /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
