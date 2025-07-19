import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  LibraryBooks as KnowledgeIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data - will be replaced with real API calls
  const stats = {
    totalChats: 24,
    documentsIndexed: 156,
    querySuccess: 92,
    lastSync: '2 hours ago',
  };

  const recentChats = [
    { id: 1, title: 'Employee Handbook Questions', timestamp: '10 minutes ago' },
    { id: 2, title: 'IT Security Policies', timestamp: '1 hour ago' },
    { id: 3, title: 'HR Benefits Overview', timestamp: '2 hours ago' },
  ];

  const quickActions = [
    {
      title: 'Start New Chat',
      description: 'Ask questions about company knowledge',
      icon: <ChatIcon />,
      action: () => navigate('/chat'),
      color: 'primary',
    },
    {
      title: 'Browse Knowledge',
      description: 'Explore documents and policies',
      icon: <KnowledgeIcon />,
      action: () => navigate('/knowledge'),
      color: 'secondary',
    },
  ];

  if (user?.is_admin) {
    quickActions.push({
      title: 'Admin Panel',
      description: 'Manage knowledge base and users',
      icon: <PersonIcon />,
      action: () => navigate('/admin'),
      color: 'success',
    });
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name?.split(' ')[0]}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Your knowledge assistant dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={action.action}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${action.color}.main`, mr: 2 }}>
                        {action.icon}
                      </Avatar>
                      <Typography variant="h6">{action.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color={action.color}>
                      Get Started
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* System Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Conversations</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.totalChats}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Documents Indexed</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.documentsIndexed}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Query Success Rate</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.querySuccess}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.querySuccess}
                sx={{ mt: 1 }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon sx={{ mr: 1, fontSize: 16 }} color="action" />
              <Typography variant="caption" color="text.secondary">
                Last sync: {stats.lastSync}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Conversations
            </Typography>
            <List>
              {recentChats.map((chat, index) => (
                <React.Fragment key={chat.id}>
                  <ListItem
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <ChatIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={chat.title}
                      secondary={chat.timestamp}
                    />
                    <Chip
                      size="small"
                      label="Continue"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                  {index < recentChats.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/chat')}>
                View All Conversations
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
