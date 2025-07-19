import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  CloudSync as SyncIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const KnowledgePage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    loadDocuments();
    loadSyncStatus();
  }, [currentPage, filterType]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/knowledge/documents', {
        params: {
          page: currentPage,
          type: filterType !== 'all' ? filterType : undefined,
          search: searchQuery || undefined,
        },
      });
      setDocuments(response.data.documents || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await api.get('/knowledge/sync-status');
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    await loadDocuments();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSync = async () => {
    try {
      await api.post('/knowledge/sync');
      loadSyncStatus();
      loadDocuments();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      confluence: 'primary',
      pdf: 'error',
      word: 'info',
      excel: 'success',
      powerpoint: 'warning',
      text: 'default',
    };
    return colors[type] || 'default';
  };

  // Mock data for demonstration
  const mockDocuments = [
    {
      id: 1,
      title: 'Employee Handbook 2024',
      type: 'pdf',
      source: 'confluence',
      content_preview: 'This handbook outlines company policies, procedures, and guidelines for all employees...',
      last_updated: '2024-01-15T10:30:00Z',
      size: 2048576,
      tags: ['HR', 'Policies', 'Guidelines'],
    },
    {
      id: 2,
      title: 'IT Security Policies',
      type: 'confluence',
      source: 'confluence',
      content_preview: 'Information security policies and procedures to protect company data and systems...',
      last_updated: '2024-01-14T15:45:00Z',
      size: 1024000,
      tags: ['IT', 'Security', 'Compliance'],
    },
    {
      id: 3,
      title: 'Benefits Overview',
      type: 'word',
      source: 'confluence',
      content_preview: 'Comprehensive overview of employee benefits including health insurance, retirement plans...',
      last_updated: '2024-01-13T09:15:00Z',
      size: 512000,
      tags: ['HR', 'Benefits', 'Insurance'],
    },
  ];

  const displayDocuments = documents.length > 0 ? documents : mockDocuments;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Knowledge Base
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse and search company documentation
        </Typography>
      </Box>

      {/* Sync Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Sync Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<SyncIcon />}
                label={syncStatus?.status || 'Ready'}
                color={syncStatus?.status === 'syncing' ? 'warning' : 'success'}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Last sync: {syncStatus?.lastSync || '2 hours ago'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents: {syncStatus?.documentCount || displayDocuments.length}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadDocuments}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              sx={{ ml: 1 }}
            >
              Sync Now
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Documents"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={filterType}
                label="Document Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="confluence">Confluence</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="word">Word</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="powerpoint">PowerPoint</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents List */}
      <Grid container spacing={3}>
        {displayDocuments.map((doc) => (
          <Grid item xs={12} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <DocumentIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {doc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        size="small"
                        label={doc.source?.toUpperCase() || 'UNKNOWN'}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={doc.department || 'General'}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {doc.content ? doc.content.substring(0, 200) + '...' : 'No content preview available'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(doc.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {doc.tags && doc.tags.filter(tag => tag).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">
                      View Content Preview
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {doc.content_preview}
                      {/* In a real implementation, this would show more content */}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  View Source
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {/* Handle download */}}
                >
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
          />
        </Box>
      )}

      {displayDocuments.length === 0 && !isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or sync the knowledge base
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default KnowledgePage;
