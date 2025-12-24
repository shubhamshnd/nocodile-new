import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import DocumentTypes from './pages/DocumentTypes';
import Forms from './pages/Forms';
import FormBuilder from './pages/FormBuilder';
import FormPreview from './pages/FormPreview';
import Workflows from './pages/Workflows';
import WorkflowBuilder from './pages/WorkflowBuilder';
import ChildForms from './pages/ChildForms';
import Users from './pages/Users';
import Roles from './pages/Roles';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
  },
  palette: {
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
        },
      },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      {/* Full-page routes (no Layout wrapper) */}
      <Route
        path="/forms/:formId/preview"
        element={
          <ProtectedRoute>
            <FormPreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/:workflowId/builder"
        element={
          <ProtectedRoute>
            <WorkflowBuilder />
          </ProtectedRoute>
        }
      />
      {/* Routes with Layout wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/document-types" element={<DocumentTypes />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/forms/:formId/builder" element={<FormBuilder />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/child-forms" element={<ChildForms />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
