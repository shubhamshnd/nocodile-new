import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Apps,
  Description,
  DynamicForm,
  AccountTree,
  Link as LinkIcon,
  Logout,
  ChevronLeft,
  Person,
  Group,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 220;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/' },
  { text: 'Applications', icon: <Apps fontSize="small" />, path: '/applications' },
  { text: 'Document Types', icon: <Description fontSize="small" />, path: '/document-types' },
  { text: 'Forms', icon: <DynamicForm fontSize="small" />, path: '/forms' },
  { text: 'Child Forms', icon: <LinkIcon fontSize="small" />, path: '/child-forms' },
  { text: 'Workflows', icon: <AccountTree fontSize="small" />, path: '/workflows' },
  { text: 'Users', icon: <Person fontSize="small" />, path: '/users' },
  { text: 'Roles', icon: <Group fontSize="small" />, path: '/roles' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fff' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#fff',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ mr: 1 }}
            size="small"
          >
            {open ? <ChevronLeft fontSize="small" /> : <MenuIcon fontSize="small" />}
          </IconButton>
          <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.875rem' }}>
            Nocodile Admin
          </Typography>
          <IconButton onClick={handleMenuOpen} size="small">
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#1976d2' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ fontSize: '0.75rem' }}>
              {user?.username}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ fontSize: '0.75rem' }}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#fafafa',
            borderRight: '1px solid #eee',
          },
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }} />
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  py: 0.75,
                  '&.Mui-selected': {
                    bgcolor: '#e3f2fd',
                    '&:hover': { bgcolor: '#bbdefb' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.8rem' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          ml: open ? 0 : `-${drawerWidth}px`,
          transition: 'margin 0.2s',
          bgcolor: '#fff',
          minHeight: '100vh',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }} />
        <Outlet />
      </Box>
    </Box>
  );
}
