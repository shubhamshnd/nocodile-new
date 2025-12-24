import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api, { formComponents, documents as documentsAPI } from '../services/api';
import type { Document, FormComponent } from '../types';

interface DocumentListProps {
  formId: string;
  onDocumentClick: (documentId: string) => void;
  onDocumentDelete?: (documentId: string) => void;
}

interface DocumentRow {
  id: string;
  docNo: string;
  status: string;
  statusColor: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const DocumentList: React.FC<DocumentListProps> = ({
  formId,
  onDocumentClick,
  onDocumentDelete,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, [formId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch form components to determine table columns
      const componentTree = await formComponents.getTree(formId);
      setComponents(componentTree);

      // Fetch all documents for this form
      // Note: We need to get documentTypeId from the form first
      const formRes = await api.get(`/forms/${formId}/`);
      const docs = await documentsAPI.list(formRes.data.documentTypeId);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(documentId);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
      if (onDocumentDelete) {
        onDocumentDelete(documentId);
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };

  // Get key field components to display as columns (limit to first 5 fields)
  const getTableColumns = (): FormComponent[] => {
    const fieldComponents = components.filter(
      (c) => c.isField && !c.componentType.includes('computed')
    );
    return fieldComponents.slice(0, 5);
  };

  // Format document data into table rows
  const formatDocumentRows = (): DocumentRow[] => {
    return documents.map((doc, index) => {
      const row: DocumentRow = {
        id: doc.id,
        docNo: `DOC-${String(index + 1).padStart(4, '0')}`,
        status: doc.isSubmitted
          ? doc.workflowState?.name || 'Submitted'
          : 'Draft',
        statusColor: doc.isSubmitted ? 'success' : 'warning',
        createdAt: new Date(doc.createdAt).toLocaleDateString(),
        updatedAt: new Date(doc.updatedAt).toLocaleDateString(),
      };

      // Add field values from document data
      const tableColumns = getTableColumns();
      tableColumns.forEach((component) => {
        const value = doc.data[component.fieldKey];
        row[component.fieldKey] = value;
      });

      return row;
    });
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const tableColumns = getTableColumns();
  const rows = formatDocumentRows();
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box
          p={4}
          borderBottom="1px solid #e0e0e0"
          sx={{
            background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: '#1a1a1a' }}>
            Documents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {documents.length} total document{documents.length !== 1 ? 's' : ''}
          </Typography>
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
                {tableColumns.map((component) => (
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
                >
                  Updated
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
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length + 5}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography color="text.secondary">
                      No documents found. Create your first document to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.id}
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
                    onClick={() => onDocumentClick(row.id)}
                  >
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {row.docNo}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        label={row.status}
                        color={row.statusColor as any}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    {tableColumns.map((component) => (
                      <TableCell key={component.id} sx={{ py: 2.5 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            maxWidth: 200,
                            color: '#424242',
                          }}
                        >
                          {formatCellValue(row[component.fieldKey])}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {row.createdAt}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {row.updatedAt}
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
                              onDocumentClick(row.id);
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
                        {onDocumentDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => handleDelete(row.id, e)}
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
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default DocumentList;
