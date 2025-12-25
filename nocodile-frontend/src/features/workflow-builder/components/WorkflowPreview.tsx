import { useEffect, useState, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Close, PlayArrow, SkipNext, RestartAlt, Info } from '@mui/icons-material';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from './WorkflowNode';
import type { ActionConfig, StatePermissions } from '../types';

interface WorkflowPreviewProps {
  open: boolean;
  onClose: () => void;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  workflowName: string;
}

// Mock document data for preview
const mockDocument = {
  id: 'DOC-2024-001',
  title: 'Guest Requisition - John Smith',
  submittedBy: 'HR Admin',
  submittedDate: new Date().toLocaleDateString(),
  fields: {
    guestName: 'John Smith',
    purpose: 'Business Meeting',
    arrivalDate: '2024-01-15',
    departureDate: '2024-01-18',
  },
};

// Mock users for approvers
const mockApprovers = [
  { name: 'Unit Head', role: 'Department Manager', avatar: 'UH' },
  { name: 'HR Manager', role: 'HR Department', avatar: 'HR' },
];

export default function WorkflowPreview({
  open,
  onClose,
  nodes,
  edges,
  workflowName,
}: WorkflowPreviewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [driverInstance, setDriverInstance] = useState<ReturnType<typeof driver> | null>(null);
  const [previewMode, setPreviewMode] = useState<'tour' | 'interactive'>('tour');
  const [currentState, setCurrentState] = useState<string>('');
  const [actionHistory, setActionHistory] = useState<string[]>([]);

  // Build workflow steps from nodes and edges
  const buildWorkflowSteps = useCallback(() => {
    const steps: Array<{
      nodeId: string;
      nodeName: string;
      nodeType: string;
      stateKey: string;
      color: string;
      permissions?: StatePermissions;
      outgoingActions: Array<{
        edgeId: string;
        actionName: string;
        actionKey: string;
        targetNodeId: string;
        targetNodeName: string;
        buttonColor: string;
        buttonVariant: 'primary' | 'secondary' | 'error';
      }>;
    }> = [];

    // Find initial state (Draft)
    const initialNode = nodes.find(
      (n) => n.data.nodeType === 'state' && (n.data.config as any)?.isInitial
    );

    if (!initialNode) return steps;

    // Build step order by traversing from initial state
    const visited = new Set<string>();
    const queue = [initialNode];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      const config = node.data.config as Record<string, any>;
      const outgoingEdges = edges.filter((e) => e.source === node.id);

      const outgoingActions = outgoingEdges.map((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        const actionConfig = edge.data?.actionConfig as ActionConfig | undefined;
        return {
          edgeId: edge.id,
          actionName: actionConfig?.buttonLabel || targetNode?.data.label || 'Continue',
          actionKey: actionConfig?.actionKey || 'continue',
          targetNodeId: edge.target,
          targetNodeName: targetNode?.data.label || 'Unknown',
          buttonColor: actionConfig?.buttonColor || '#1976d2',
          buttonVariant: (actionConfig?.buttonVariant || 'primary') as 'primary' | 'secondary' | 'error',
        };
      });

      steps.push({
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: node.data.nodeType,
        stateKey: config?.stateKey || '',
        color: config?.color || '#1976d2',
        permissions: config?.permissions,
        outgoingActions,
      });

      // Add target nodes to queue
      for (const edge of outgoingEdges) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode && !visited.has(targetNode.id)) {
          queue.push(targetNode);
        }
      }
    }

    return steps;
  }, [nodes, edges]);

  const workflowSteps = buildWorkflowSteps();

  // Initialize driver.js tour
  useEffect(() => {
    if (!open || previewMode !== 'tour' || workflowSteps.length === 0) return;

    const driverSteps = workflowSteps.map((step, index) => ({
      element: `#preview-step-${index}`,
      popover: {
        title: `Step ${index + 1}: ${step.nodeName}`,
        description: buildStepDescription(step, index),
        side: 'right' as const,
        align: 'start' as const,
      },
    }));

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'workflow-preview-popover',
      steps: driverSteps,
      onDestroyStarted: () => {
        setCurrentStep(0);
      },
    });

    setDriverInstance(driverObj);

    return () => {
      driverObj.destroy();
    };
  }, [open, previewMode, workflowSteps]);

  // Build step description
  const buildStepDescription = (
    step: ReturnType<typeof buildWorkflowSteps>[0],
    _index: number
  ) => {
    let desc = `<div style="font-size: 13px; line-height: 1.6;">`;

    // Permissions info
    if (step.permissions) {
      desc += `<div style="margin-bottom: 8px;">`;
      if (step.permissions.editMainForm) {
        desc += `<span style="color: #4caf50;">✓ Can edit main form</span><br/>`;
      } else {
        desc += `<span style="color: #f44336;">✗ Cannot edit main form</span><br/>`;
      }
      if (step.permissions.editChildForms) {
        desc += `<span style="color: #4caf50;">✓ Can edit child forms</span>`;
      } else {
        desc += `<span style="color: #f44336;">✗ Cannot edit child forms</span>`;
      }
      desc += `</div>`;
    }

    // Available actions
    if (step.outgoingActions.length > 0) {
      desc += `<div style="margin-top: 8px;"><strong>Available Actions:</strong><br/>`;
      for (const action of step.outgoingActions) {
        const color =
          action.buttonVariant === 'error'
            ? '#f44336'
            : action.buttonVariant === 'secondary'
            ? '#9e9e9e'
            : action.buttonColor;
        desc += `<span style="display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; background: ${color}; color: white; font-size: 11px;">${action.actionName}</span> → ${action.targetNodeName}<br/>`;
      }
      desc += `</div>`;
    } else {
      desc += `<div style="margin-top: 8px; color: #4caf50;"><strong>✓ Final State</strong> - Workflow complete</div>`;
    }

    desc += `</div>`;
    return desc;
  };

  // Start tour
  const startTour = () => {
    if (driverInstance) {
      driverInstance.drive();
    }
  };

  // Reset preview
  const resetPreview = () => {
    setCurrentStep(0);
    setCurrentState(workflowSteps[0]?.stateKey || '');
    setActionHistory([]);
  };

  // Handle action click in interactive mode
  const handleActionClick = (actionName: string, targetNodeId: string) => {
    const targetIndex = workflowSteps.findIndex((s) => s.nodeId === targetNodeId);
    if (targetIndex !== -1) {
      setActionHistory((prev) => [...prev, actionName]);
      setCurrentStep(targetIndex);
      setCurrentState(workflowSteps[targetIndex].stateKey);
    }
  };

  // Get button variant style
  const getButtonStyle = (variant: string, color: string) => {
    if (variant === 'error') {
      return { bgcolor: '#f44336', color: 'white', '&:hover': { bgcolor: '#d32f2f' } };
    }
    if (variant === 'secondary') {
      return { bgcolor: '#f5f5f5', color: '#333', border: '1px solid #ccc', '&:hover': { bgcolor: '#e0e0e0' } };
    }
    return { bgcolor: color, color: 'white', '&:hover': { bgcolor: color, opacity: 0.9 } };
  };

  if (workflowSteps.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600 }}>Workflow Preview</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            No workflow states found. Please add states to the workflow first.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Workflow Preview: {workflowName}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            See how the workflow will function with mock data
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Mode toggle */}
          <Chip
            label="Tour Mode"
            size="small"
            variant={previewMode === 'tour' ? 'filled' : 'outlined'}
            onClick={() => setPreviewMode('tour')}
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label="Interactive"
            size="small"
            variant={previewMode === 'interactive' ? 'filled' : 'outlined'}
            onClick={() => setPreviewMode('interactive')}
            sx={{ fontSize: '0.7rem' }}
          />
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', height: '70vh' }}>
        {/* Left Panel - Workflow Steps */}
        <Box sx={{ width: 280, borderRight: '1px solid #e0e0e0', overflow: 'auto', bgcolor: '#fafafa' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
              Workflow States
            </Typography>
            {previewMode === 'tour' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow />}
                onClick={startTour}
                fullWidth
                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
              >
                Start Tour
              </Button>
            )}
            {previewMode === 'interactive' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestartAlt />}
                onClick={resetPreview}
                fullWidth
                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
              >
                Reset
              </Button>
            )}
          </Box>

          {/* Steps list */}
          <Box sx={{ p: 1 }}>
            {workflowSteps.map((step, index) => (
              <Paper
                key={step.nodeId}
                id={`preview-step-${index}`}
                elevation={currentStep === index ? 2 : 0}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  border: currentStep === index ? `2px solid ${step.color}` : '1px solid #e0e0e0',
                  bgcolor: currentStep === index ? `${step.color}10` : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: step.color,
                  },
                }}
                onClick={() => previewMode === 'interactive' && setCurrentStep(index)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'white',
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {step.nodeName}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', ml: 4 }}>
                  {step.outgoingActions.length > 0
                    ? `${step.outgoingActions.length} action(s) available`
                    : 'Final state'}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Right Panel - Mock Document Preview */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f5f5f5' }}>
          <Box sx={{ p: 3 }}>
            {/* Action History */}
            {actionHistory.length > 0 && (
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
                <strong>Action History:</strong> {actionHistory.join(' → ')}
              </Alert>
            )}

            {/* Current State Banner */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: workflowSteps[currentStep]?.color || '#1976d2',
                color: 'white',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.9 }}>Current State</Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {workflowSteps[currentStep]?.nodeName || 'Unknown'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.8, mt: 0.5 }}>
                State Key: {workflowSteps[currentStep]?.stateKey || '-'}
              </Typography>
            </Paper>

            {/* Permissions Info */}
            {workflowSteps[currentStep]?.permissions && (
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Info sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Permissions at this Stage
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={workflowSteps[currentStep].permissions?.editMainForm ? 'Can Edit Main Form' : 'Read-Only Main Form'}
                      size="small"
                      color={workflowSteps[currentStep].permissions?.editMainForm ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={workflowSteps[currentStep].permissions?.editChildForms ? 'Can Edit Child Forms' : 'Read-Only Child Forms'}
                      size="small"
                      color={workflowSteps[currentStep].permissions?.editChildForms ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Mock Document Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                  Document Preview
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Document ID
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Submitted By
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.submittedBy}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Guest Name
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.fields.guestName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Purpose
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.fields.purpose}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Arrival Date
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.fields.arrivalDate}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Departure Date
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {mockDocument.fields.departureDate}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Available Actions */}
            {workflowSteps[currentStep]?.outgoingActions.length > 0 && (
              <Card>
                <CardContent>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                    Available Actions
                  </Typography>

                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}>
                    As the approver at this stage, you can take the following actions:
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {workflowSteps[currentStep].outgoingActions.map((action) => (
                      <Button
                        key={action.edgeId}
                        variant="contained"
                        size="medium"
                        onClick={() =>
                          previewMode === 'interactive' &&
                          handleActionClick(action.actionName, action.targetNodeId)
                        }
                        sx={{
                          ...getButtonStyle(action.buttonVariant, action.buttonColor),
                          textTransform: 'none',
                          fontSize: '0.85rem',
                          px: 3,
                          py: 1,
                        }}
                        disabled={previewMode === 'tour'}
                      >
                        {action.actionName}
                      </Button>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {workflowSteps[currentStep].outgoingActions.map((action, idx) => (
                        <span key={action.edgeId}>
                          <strong>{action.actionName}</strong> → moves to{' '}
                          <em>{action.targetNodeName}</em>
                          {idx < workflowSteps[currentStep].outgoingActions.length - 1 && ' | '}
                        </span>
                      ))}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Final State Message */}
            {workflowSteps[currentStep]?.outgoingActions.length === 0 && (
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#2e7d32', mb: 1 }}>
                    ✓ Workflow Complete
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#4caf50' }}>
                    The document has reached its final state: {workflowSteps[currentStep]?.nodeName}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Approver Info (for demo) */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#e65100', mb: 1 }}>
                Demo: Current Approver
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#ff9800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {mockApprovers[currentStep % mockApprovers.length]?.avatar}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {mockApprovers[currentStep % mockApprovers.length]?.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {mockApprovers[currentStep % mockApprovers.length]?.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
