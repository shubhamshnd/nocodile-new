import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Apps,
  Description,
  DynamicForm,
  AccountTree,
  Folder,
  Send,
  Edit,
} from '@mui/icons-material';
import { dashboard } from '../services/api';
import type { DashboardStats } from '../types';

const statCards = [
  { key: 'applications', label: 'Applications', icon: Apps, color: '#1976d2', path: '/applications' },
  { key: 'documentTypes', label: 'Document Types', icon: Description, color: '#388e3c', path: '/document-types' },
  { key: 'forms', label: 'Forms', icon: DynamicForm, color: '#f57c00', path: '/forms' },
  { key: 'workflows', label: 'Workflows', icon: AccountTree, color: '#7b1fa2', path: '/workflows' },
  { key: 'documents', label: 'Documents', icon: Folder, color: '#0288d1' },
  { key: 'submittedDocuments', label: 'Submitted', icon: Send, color: '#2e7d32' },
  { key: 'draftDocuments', label: 'Drafts', icon: Edit, color: '#ed6c02' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboard.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, fontSize: '0.9rem' }}>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key as keyof DashboardStats] ?? 0;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
              <Card
                sx={{
                  cursor: card.path ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s',
                  '&:hover': card.path ? { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } : {},
                }}
                onClick={() => card.path && navigate(card.path)}
              >
                <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: `${card.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ color: card.color, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1 }}>
                        {value}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {card.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
