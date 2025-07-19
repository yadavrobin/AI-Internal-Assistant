import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const AdminPage = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // User Queries State
  const [queries, setQueries] = useState([]);
  const [queriesPage, setQueriesPage] = useState(0);
  const [queriesRowsPerPage, setQueriesRowsPerPage] = useState(10);
  const [queriesTotal, setQueriesTotal] = useState(0);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [queryDialog, setQueryDialog] = useState(false);
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Knowledge Management State
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    department: '',
    tags: '',
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock data for development
  const mockQueries = [
    {
      id: 1,
      user_name: 'John Doe',
      content: 'What is the company leave policy?',
      created_at: '2025-07-19T04:54:15.000Z',
      has_response: true,
      response: 'Our company provides various types of leave...'
    },
    {
      id: 2,
      user_name: 'Jane Smith',
      content: 'How do I access the VPN?',
      created_at: '2025-07-18T15:30:00.000Z',
      has_response: true,
      response: 'To access VPN, please follow these steps...'
    }
  ];

  const mockKnowledgeEntries = [
    {
      id: 1,
      title: 'Company Leave Policy',
      content: 'Employees are entitled to 15 days of paid vacation annually...',
      department: 'HR',
      tags: ['leave', 'vacation', 'policy'],
      created_at: '2025-07-15T10:00:00.000Z'
    }
  ];

  // Load user queries
  const loadQueries = async () => {
    setQueriesLoading(true);
    try {
      const response = await api.get(`/admin/queries?page=${queriesPage + 1}&limit=${queriesRowsPerPage}`);
      setQueries(response.data.queries);
      setQueriesTotal(response.data.total);
      setQueriesLoading(false);
    } catch (error) {
      console.error('Failed to load queries:', error);
      setErrorMessage('Failed to load user queries');
      setQueriesLoading(false);
    }
  };

  // Load knowledge entries
  const loadKnowledgeEntries = async () => {
    setKnowledgeLoading(true);
    try {
      const response = await api.get('/admin/knowledge');
      setKnowledgeEntries(response.data.entries.map(entry => ({
        ...entry,
        tags: typeof entry.tags === 'string' ? JSON.parse(entry.tags) : entry.tags
      })));
      setKnowledgeLoading(false);
    } catch (error) {
      console.error('Failed to load knowledge entries:', error);
      setErrorMessage('Failed to load knowledge entries');
      setKnowledgeLoading(false);
    }
  };

  // Add new knowledge entry
  const handleAddKnowledge = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      setErrorMessage('Title and content are required');
      return;
    }

    setSaveLoading(true);
    try {
      const entryData = {
        ...newEntry,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      const response = await api.post('/admin/knowledge', entryData);
      
      if (response.data.success) {
        setSuccessMessage('Knowledge entry added successfully');
        setNewEntry({ title: '', content: '', department: '', tags: '' });
        loadKnowledgeEntries(); // Reload the entries
      }
      setSaveLoading(false);
    } catch (error) {
      console.error('Failed to add knowledge entry:', error);
      setErrorMessage('Failed to add knowledge entry');
      setSaveLoading(false);
    }
  };

  // Update knowledge entry
  const handleUpdateKnowledge = async (id, updatedEntry) => {
    setSaveLoading(true);
    try {
      const entryData = {
        ...updatedEntry,
        tags: typeof updatedEntry.tags === 'string' 
          ? updatedEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : updatedEntry.tags,
      };
      
      const response = await api.put(`/admin/knowledge/${id}`, entryData);
      
      if (response.data.success) {
        setSuccessMessage('Knowledge entry updated successfully');
        setEditingEntry(null);
        loadKnowledgeEntries(); // Reload the entries
      }
    } catch (error) {
      console.error('Failed to update knowledge entry:', error);
      setErrorMessage('Failed to update knowledge entry');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete knowledge entry
  const handleDeleteKnowledge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this knowledge entry?')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/knowledge/${id}`);
      
      if (response.data.success) {
        setSuccessMessage('Knowledge entry deleted successfully');
        loadKnowledgeEntries(); // Reload the entries
      }
    } catch (error) {
      console.error('Failed to delete knowledge entry:', error);
      setErrorMessage('Failed to delete knowledge entry');
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      loadQueries();
    } else if (tabValue === 1) {
      loadKnowledgeEntries();
    }
  }, [tabValue, queriesPage, queriesRowsPerPage]);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleQueryView = (query) => {
    setSelectedQuery(query);
    setQueryDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#f4f4f4', mb: 3 }}>
        Admin Dashboard
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ width: '100%', backgroundColor: '#252836' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #404040',
            '& .MuiTab-root': {
              color: '#b3b3b3',
              '&.Mui-selected': {
                color: '#f4f4f4',
              },
            },
          }}
        >
          <Tab label="User Queries" />
          <Tab label="Knowledge Management" />
        </Tabs>

        {/* User Queries Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#f4f4f4' }}>
              User Queries & Chat History
            </Typography>
            
            {queriesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#f4f4f4' }}>User</TableCell>
                        <TableCell sx={{ color: '#f4f4f4' }}>Query</TableCell>
                        <TableCell sx={{ color: '#f4f4f4' }}>Date</TableCell>
                        <TableCell sx={{ color: '#f4f4f4' }}>Response Status</TableCell>
                        <TableCell sx={{ color: '#f4f4f4' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queries.map((query) => (
                        <TableRow key={query.id}>
                          <TableCell sx={{ color: '#e1e1e1' }}>
                            {query.user_name || 'Unknown User'}
                          </TableCell>
                          <TableCell sx={{ color: '#e1e1e1', maxWidth: 400 }}>
                            {query.content?.length > 100 
                              ? `${query.content.substring(0, 100)}...` 
                              : query.content}
                          </TableCell>
                          <TableCell sx={{ color: '#b3b3b3' }}>
                            {formatDate(query.created_at)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={query.has_response ? 'Answered' : 'Pending'}
                              color={query.has_response ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleQueryView(query)}
                              size="small"
                              sx={{ color: '#f4f4f4' }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={queriesTotal}
                  page={queriesPage}
                  onPageChange={(event, newPage) => setQueriesPage(newPage)}
                  rowsPerPage={queriesRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setQueriesRowsPerPage(parseInt(event.target.value, 10));
                    setQueriesPage(0);
                  }}
                  sx={{ color: '#f4f4f4' }}
                />
              </>
            )}
          </Box>
        )}

        {/* Knowledge Management Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#f4f4f4' }}>
              Knowledge Base Management
            </Typography>
            
            {/* Add New Knowledge Form */}
            <Card sx={{ mb: 3, backgroundColor: '#2a2f3e' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#f4f4f4' }}>
                  Add New Knowledge Entry
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#1a1d29',
                          color: '#ffffff',
                          '& fieldset': {
                            borderColor: '#3a3f4f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#b8bcc8',
                          '&.Mui-focused': {
                            color: '#3b82f6',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={newEntry.department}
                      onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value })}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#1a1d29',
                          color: '#ffffff',
                          '& fieldset': {
                            borderColor: '#3a3f4f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#b8bcc8',
                          '&.Mui-focused': {
                            color: '#3b82f6',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Tags (comma separated)"
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#1a1d29',
                          color: '#ffffff',
                          '& fieldset': {
                            borderColor: '#3a3f4f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#b8bcc8',
                          '&.Mui-focused': {
                            color: '#3b82f6',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Content"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      variant="outlined"
                      multiline
                      rows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#1a1d29',
                          color: '#ffffff',
                          '& fieldset': {
                            borderColor: '#3a3f4f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#b8bcc8',
                          '&.Mui-focused': {
                            color: '#3b82f6',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={saveLoading ? <CircularProgress size={20} /> : <AddIcon />}
                      onClick={handleAddKnowledge}
                      disabled={saveLoading}
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': {
                          backgroundColor: '#2563eb',
                        },
                      }}
                    >
                      Add Knowledge Entry
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Existing Knowledge Entries */}
            {knowledgeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#f4f4f4' }}>
                  Existing Knowledge Entries
                </Typography>
                
                {knowledgeEntries.map((entry) => (
                  <Card key={entry.id} sx={{ mb: 2, backgroundColor: '#2a2f3e' }}>
                    <CardContent>
                      {editingEntry?.id === entry.id ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Title"
                              value={editingEntry.title}
                              onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              label="Department"
                              value={editingEntry.department}
                              onChange={(e) => setEditingEntry({ ...editingEntry, department: e.target.value })}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              label="Tags"
                              value={Array.isArray(editingEntry.tags) ? editingEntry.tags.join(', ') : editingEntry.tags}
                              onChange={(e) => setEditingEntry({ ...editingEntry, tags: e.target.value })}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Content"
                              value={editingEntry.content}
                              onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                              variant="outlined"
                              multiline
                              rows={4}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => handleUpdateKnowledge(entry.id, editingEntry)}
                                disabled={saveLoading}
                                sx={{
                                  backgroundColor: '#3b82f6',
                                  '&:hover': {
                                    backgroundColor: '#2563eb',
                                  },
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => setEditingEntry(null)}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#f4f4f4' }}>
                              {entry.title}
                            </Typography>
                            <Box>
                              <IconButton
                                onClick={() => setEditingEntry(entry)}
                                size="small"
                                sx={{ color: '#f4f4f4', mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeleteKnowledge(entry.id)}
                                size="small"
                                sx={{ color: '#ff6b6b' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Chip label={entry.department || 'General'} size="small" sx={{ mr: 1 }} />
                            {entry.tags && entry.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                            ))}
                          </Box>
                          
                          <Typography variant="body2" sx={{ color: '#e1e1e1' }}>
                            {entry.content?.length > 300 
                              ? `${entry.content.substring(0, 300)}...` 
                              : entry.content}
                          </Typography>
                          
                          <Typography variant="caption" sx={{ color: '#b3b3b3', mt: 1, display: 'block' }}>
                            Created: {formatDate(entry.created_at)}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Query Details Dialog */}
      <Dialog 
        open={queryDialog} 
        onClose={() => setQueryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Query Details</DialogTitle>
        <DialogContent>
          {selectedQuery && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                User: {selectedQuery.user_name || 'Unknown User'}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Date: {formatDate(selectedQuery.created_at)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Query:
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedQuery.content}
              </Typography>
              {selectedQuery.response && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Response:
                  </Typography>
                  <Typography variant="body1">
                    {selectedQuery.response}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
