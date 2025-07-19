import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Fab,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  InputAdornment,
  Badge,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (page = 1, search = '') => {
    try {
      setIsSearching(!!search);
      let url = search 
        ? `/chat/conversations/search?q=${encodeURIComponent(search)}&page=${page}&limit=10`
        : `/chat/conversations?page=${page}&limit=10`;
      
      const response = await api.get(url);
      setConversations(response.data.conversations);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    // Avoid reloading the same conversation
    if (currentConversationId === conversationId) {
      return;
    }
    
    try {
      setIsLoading(true); // Show loading state during conversation switch
      const response = await api.get(`/chat/conversations/${conversationId}`);
      const conversation = response.data.conversation;
      
      // Parse the messages from the conversation
      const parsedMessages = conversation.messages.map((msg, index) => {
        const userMsg = {
          id: `user-${conversationId}-${index}`,
          content: msg.user.content,
          sender: 'user',
          timestamp: msg.timestamp,
        };
        
        let assistantContent;
        try {
          assistantContent = JSON.parse(msg.assistant.content).response;
        } catch {
          assistantContent = msg.assistant.content; // Fallback if not JSON
        }
        
        const assistantMsg = {
          id: `assistant-${conversationId}-${index}`,
          content: assistantContent,
          sender: 'assistant',
          timestamp: msg.timestamp,
          sources: [], // Could extract from context if needed
        };
        
        return [userMsg, assistantMsg];
      }).flat();

      setMessages(parsedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInputMessage('');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: inputMessage,
        conversationId: currentConversationId,
      });

      // Handle the response from our backend
      let responseContent;
      let sources = [];
      
      if (typeof response.data.response === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsedResponse = JSON.parse(response.data.response);
          responseContent = parsedResponse.response || response.data.response;
        } catch {
          // If parsing fails, use the raw string
          responseContent = response.data.response;
        }
      } else if (response.data.response && response.data.response.response) {
        // If it's already an object
        responseContent = response.data.response.response;
      } else {
        responseContent = response.data.response || 'No response received';
      }

      sources = response.data.context_documents || [];
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        sources: sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!currentConversationId && response.data.conversationId) {
        setCurrentConversationId(response.data.conversationId);
        loadConversations(); // Refresh conversations list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = async (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      await loadConversations(1, searchQuery);
    }
  };

  const handlePageChange = (event, value) => {
    loadConversations(value, searchQuery);
  };

  const handleConversationMenu = (event, conversation) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedConversation here - let dialogs handle it
  };

  const handleEditConversation = () => {
    setEditTitle(selectedConversation.title);
    setEditDialog(true);
    handleMenuClose();
  };

  const handleDeleteConversation = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleEditCancel = () => {
    setEditDialog(false);
    setSelectedConversation(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setSelectedConversation(null);
  };

  const saveConversationTitle = async () => {
    if (!selectedConversation) {
      console.error('No conversation selected for title update');
      setEditDialog(false);
      return;
    }
    
    try {
      await api.put(`/chat/conversations/${selectedConversation.id}`, {
        title: editTitle
      });
      setEditDialog(false);
      setSelectedConversation(null); // Clear after successful save
      loadConversations(); // Refresh list
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation) {
      console.error('No conversation selected for deletion');
      setDeleteDialog(false);
      return;
    }
    
    try {
      await api.delete(`/chat/conversations/${selectedConversation.id}`);
      setDeleteDialog(false);
      setSelectedConversation(null); // Clear after successful delete
      if (currentConversationId === selectedConversation.id) {
        startNewConversation();
      }
      loadConversations(); // Refresh list
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/chat/conversations/analytics');
      setAnalytics(response.data);
      setAnalyticsDialog(true);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 140px)' }}>
      <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
        {/* Conversations Sidebar */}
        <Box sx={{ width: { xs: '100%', md: '25%' }, minWidth: 300 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Conversations
                </Typography>
                <Box>
                  <Tooltip title="Analytics">
                    <IconButton size="small" onClick={loadAnalytics}>
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Start New Conversation">
                    <Fab
                      size="small"
                      color="primary"
                      onClick={startNewConversation}
                      sx={{ ml: 1 }}
                    >
                      <AddIcon />
                    </Fab>
                  </Tooltip>
                </Box>
              </Box>
              
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {conversations.map((conv) => (
                <ListItem
                  key={conv.id}
                  button={true}
                  selected={currentConversationId === conv.id}
                  onClick={() => loadConversation(conv.id)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'none !important', // Disable transitions
                    '&.Mui-selected': {
                      bgcolor: '#3b82f6',
                      color: '#ffffff',
                    },
                    '&:hover': {
                      bgcolor: 'transparent !important', // Force no hover effect
                    },
                    '&.MuiListItem-button:hover': {
                      bgcolor: 'transparent !important', // Force no hover effect
                    },
                  }}
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={(e) => handleConversationMenu(e, conv)}
                      sx={{ 
                        color: 'inherit',
                        '&:hover': {
                          bgcolor: 'transparent !important',
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {conv.title || 'New Conversation'}
                        </Typography>
                        {conv.messageCount > 0 && (
                          <Badge badgeContent={conv.messageCount} color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    }
                    secondary={new Date(conv.updatedAt).toLocaleDateString()}
                  />
                </ListItem>
              ))}
              {conversations.length === 0 && !isSearching && (
                <ListItem>
                  <ListItemText
                    primary="No conversations yet"
                    secondary="Start a new conversation to get help"
                  />
                </ListItem>
              )}
              {conversations.length === 0 && isSearching && (
                <ListItem>
                  <ListItemText
                    primary="No matches found"
                    secondary="Try a different search term"
                  />
                </ListItem>
              )}
            </List>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  size="small"
                  sx={{ display: 'flex', justifyContent: 'center' }}
                />
              </Box>
            )}
          </Paper>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">
                {currentConversationId ? 'Conversation' : 'New Conversation'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ask questions about company knowledge and policies
              </Typography>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {messages.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                  }}
                >
                  <BotIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Welcome to Enterprise Knowledge Assistant
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask me anything about company policies, procedures, or documentation.
                  </Typography>
                </Box>
              )}

              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                      mx: 1,
                    }}
                  >
                    {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                  </Avatar>
                  <Box sx={{ maxWidth: '70%' }}>
                    <Card
                      sx={{
                        bgcolor: message.sender === 'user' ? '#3b82f6' : '#2a2f3e',
                        color: message.sender === 'user' ? '#ffffff' : '#ffffff',
                        border: '1px solid #3a3f4f',
                        borderRadius: 3,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        {message.sources && message.sources.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block" gutterBottom>
                              Sources:
                            </Typography>
                            {message.sources.map((source, index) => (
                              <Chip
                                key={index}
                                label={source.title || source.document}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                icon={<SearchIcon />}
                              />
                            ))}
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            opacity: 0.7,
                            textAlign: message.sender === 'user' ? 'right' : 'left',
                          }}
                        >
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              ))}

              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mx: 1 }}>
                    <BotIcon />
                  </Avatar>
                  <Card sx={{ 
                    bgcolor: '#2a2f3e',
                    border: '1px solid #3a3f4f',
                    borderRadius: 3,
                  }}>
                    <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 2, color: '#3b82f6' }} />
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>Thinking...</Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Divider />
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here..."
                  variant="outlined"
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#2a2f3e',
                      color: '#ffffff',
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#3a3f4f',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#9ca3af',
                      opacity: 1,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Press Enter to send, Shift+Enter for new line
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditConversation}>
          <EditIcon sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteConversation} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Conversation Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={saveConversationTitle} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={deleteConversation} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conversation Analytics</DialogTitle>
        <DialogContent>
          {analytics && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ minWidth: 200 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Conversations
                    </Typography>
                    <Typography variant="h4">
                      {analytics.totalConversations}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Messages
                    </Typography>
                    <Typography variant="h4">
                      {analytics.totalMessages}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Messages/Conv
                    </Typography>
                    <Typography variant="h4">
                      {analytics.averageMessagesPerConversation}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Engagement Rate
                    </Typography>
                    <Typography variant="h4">
                      {analytics.engagementRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      This Week
                    </Typography>
                    <Typography>
                      Conversations: {analytics.thisWeek.conversations} | 
                      Messages: {analytics.thisWeek.messages}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatPage;
