import React, { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { childForms as childFormsAPI, documents as documentsAPI, forms as formsAPI, formComponents } from '../services/api';
import type { ChildForm, Document, FormComponent } from '../types';

interface ChildFormTabsProps {
  parentDocumentId: string;
  documentTypeId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`child-form-tabpanel-${index}`}
      aria-labelledby={`child-form-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ChildFormTabs: React.FC<ChildFormTabsProps> = ({
  parentDocumentId,
  documentTypeId,
}) => {
  const [childForms, setChildForms] = useState<ChildForm[]>([]);
  const [childDocuments, setChildDocuments] = useState<Record<string, Document[]>>({});
  const [childFormComponents, setChildFormComponents] = useState<Record<string, FormComponent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchChildForms();
  }, [documentTypeId, parentDocumentId]);

  const fetchChildForms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch child form definitions
      const childFormsList = await childFormsAPI.list(documentTypeId);
      setChildForms(childFormsList);

      // Fetch child documents for each child form
      const documentsMap: Record<string, Document[]> = {};
      const componentsMap: Record<string, FormComponent[]> = {};

      for (const childForm of childFormsList) {
        // Fetch child documents
        const docs = await documentsAPI.list(childForm.childDocumentTypeId, parentDocumentId);
        documentsMap[childForm.id] = docs;

        // Fetch child form components to determine table columns
        // First get the form for this document type
        const formsList = await formsAPI.list(childForm.childDocumentTypeId);
        if (formsList && formsList.length > 0) {
          const form = formsList[0];
          const componentTree = await formComponents.getTree(form.id);
          componentsMap[childForm.id] = componentTree.filter(
            (c: FormComponent) => c.isField
          );
        }
      }

      setChildDocuments(documentsMap);
      setChildFormComponents(componentsMap);
    } catch (err: any) {
      console.error('Error fetching child forms:', err);
      setError(err.response?.data?.detail || 'Failed to load child forms');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeleteChild = async (childFormId: string, documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this child document?')) {
      return;
    }

    try {
      await documentsAPI.delete(documentId);

      // Refresh child documents
      setChildDocuments((prev) => ({
        ...prev,
        [childFormId]: prev[childFormId].filter((doc) => doc.id !== documentId),
      }));
    } catch (err: any) {
      console.error('Error deleting child document:', err);
      alert('Failed to delete child document');
    }
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const renderChildDocumentsTable = (childForm: ChildForm) => {
    const documents = childDocuments[childForm.id] || [];
    const components = (childFormComponents[childForm.id] || []).slice(0, 5);

    return (
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box
          p={4}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid #e0e0e0"
          sx={{
            background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a1a' }}>
              Child Documents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // TODO: Implement create child document
              alert('Create child document - to be implemented');
            }}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Add Document
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0',
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#424242',
                    py: 2,
                  }}
                >
                  Doc No
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#424242',
                    py: 2,
                  }}
                >
                  Status
                </TableCell>
                {components.map((component) => (
                  <TableCell
                    key={component.id}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#424242',
                      py: 2,
                    }}
                  >
                    {component.config.label || component.fieldKey}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#424242',
                    py: 2,
                  }}
                >
                  Created
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#424242',
                    py: 2,
                  }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={components.length + 4}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography color="text.secondary">
                      No child documents found. Click "Add Document" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc, index) => (
                  <TableRow
                    key={doc.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#f8f9fa',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      },
                      '&:not(:last-child)': {
                        borderBottom: '1px solid #f0f0f0',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        DOC-{String(index + 1).padStart(4, '0')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        label={doc.isSubmitted ? 'Submitted' : 'Draft'}
                        color={doc.isSubmitted ? 'success' : 'warning'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    {components.map((component) => (
                      <TableCell key={component.id} sx={{ py: 2.5 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            maxWidth: 200,
                            color: '#424242',
                          }}
                        >
                          {formatCellValue(doc.data[component.fieldKey])}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2.5 }}>
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <Tooltip title="View/Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implement edit child document
                              alert('Edit child document - to be implemented');
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'white',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChild(childForm.id, doc.id);
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: 'error.light',
                                color: 'white',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (childForms.length === 0) {
    return null; // No child forms configured
  }

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Related Forms
      </Typography>
      <Paper elevation={0} variant="outlined" sx={{ mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="child forms tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: '#fafafa',
          }}
        >
          {childForms.map((childForm, index) => (
            <Tab
              key={childForm.id}
              label={`Child Form ${index + 1}`}
              id={`child-form-tab-${index}`}
              aria-controls={`child-form-tabpanel-${index}`}
            />
          ))}
        </Tabs>
        {childForms.map((childForm, index) => (
          <TabPanel key={childForm.id} value={activeTab} index={index}>
            {renderChildDocumentsTable(childForm)}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default ChildFormTabs;
