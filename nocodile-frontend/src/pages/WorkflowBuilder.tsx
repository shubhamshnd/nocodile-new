import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  PlayArrow,
} from '@mui/icons-material';
import WorkflowNodeComponent from '../features/workflow-builder/components/WorkflowNode';
import type { WorkflowNodeData } from '../features/workflow-builder/components/WorkflowNode';
import WorkflowPreview from '../features/workflow-builder/components/WorkflowPreview';
import { NodePalette } from '../features/workflow-builder/palette/NodePalette';
import { PropertiesPanel } from '../features/workflow-builder/panels/PropertiesPanel';
import { ConnectionProperties } from '../features/workflow-builder/panels/ConnectionProperties';
import type { WorkflowNodeType, ActionConfig } from '../features/workflow-builder/types';
import { getDefaultNodeConfig, STATE_PRESETS } from '../features/workflow-builder/types';
import { workflows, workflowGraph as workflowGraphApi } from '../services/api';
import type { Workflow } from '../types';

// Define the custom node type
type WorkflowNode = Node<WorkflowNodeData, 'workflowNode'>;

// Register custom node types
const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

// Inner component that uses React Flow hooks
function WorkflowBuilderInner() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Mock data for now - will be loaded from API
  const [formFields] = useState<Array<{ fieldKey: string; config: { label?: string } }>>([]);
  const [roles] = useState<Array<{ id: string; name: string }>>([]);
  const [users] = useState<Array<{ id: string; firstName: string; lastName: string; username: string }>>([]);
  const [childForms] = useState<Array<{ id: string; name: string }>>([]);

  // Create default workflow with Draft and Complete states
  const createDefaultWorkflow = useCallback(() => {
    const draftPreset = STATE_PRESETS.find((p) => p.key === 'draft')!;
    const completedPreset = STATE_PRESETS.find((p) => p.key === 'completed')!;

    const draftNode: WorkflowNode = {
      id: `state_draft_${Date.now()}`,
      type: 'workflowNode',
      position: { x: 150, y: 150 },
      data: {
        nodeType: 'state',
        label: draftPreset.name,
        config: {
          name: draftPreset.name,
          stateKey: draftPreset.stateKey,
          color: draftPreset.color,
          isInitial: true,
          isFinal: false,
          allowEdit: true,
          permissions: draftPreset.defaultPermissions,
        },
      },
    };

    const completedNode: WorkflowNode = {
      id: `state_completed_${Date.now() + 1}`,
      type: 'workflowNode',
      position: { x: 550, y: 150 },
      data: {
        nodeType: 'state',
        label: completedPreset.name,
        config: {
          name: completedPreset.name,
          stateKey: completedPreset.stateKey,
          color: completedPreset.color,
          isInitial: false,
          isFinal: true,
          allowEdit: false,
          permissions: completedPreset.defaultPermissions,
        },
      },
    };

    setNodes([draftNode, completedNode]);
  }, [setNodes]);

  // Load workflow data
  useEffect(() => {
    if (!workflowId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load workflow metadata
        const wf = await workflows.get(workflowId);
        setWorkflow(wf);

        // Try to load existing graph
        try {
          const graphData = await workflowGraphApi.get(workflowId);
          if (graphData && graphData.nodes && graphData.nodes.length > 0) {
            // Convert to React Flow format
            const flowNodes: WorkflowNode[] = graphData.nodes.map((n) => ({
              id: n.id,
              type: 'workflowNode' as const,
              position: n.position,
              data: {
                nodeType: n.type as WorkflowNodeType,
                label: n.label,
                config: n.config,
              },
            }));

            const flowEdges: Edge[] = graphData.connections.map((c) => ({
              id: c.id,
              source: c.sourceNodeId,
              target: c.targetNodeId,
              sourceHandle: c.sourceOutput,
              targetHandle: c.targetInput,
              type: 'smoothstep',
              data: c.actionConfig ? { actionConfig: c.actionConfig } : undefined,
            }));

            setNodes(flowNodes);
            setEdges(flowEdges);
          } else {
            // Create default workflow with Draft and Complete states
            createDefaultWorkflow();
          }
        } catch {
          // No existing graph
          createDefaultWorkflow();
        }
      } catch (err) {
        console.error('Failed to load workflow:', err);
        setError('Failed to load workflow data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workflowId, setNodes, setEdges, createDefaultWorkflow]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: WorkflowNode) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Handle node property updates
  const handleNodeUpdate = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedNode) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            const updatedNode: WorkflowNode = {
              ...node,
              data: {
                ...node.data,
                config,
                label: (config.name as string) || node.data.label,
              },
            };
            // Update selectedNode reference
            setSelectedNode(updatedNode);
            return updatedNode;
          }
          return node;
        })
      );
    },
    [selectedNode, setNodes]
  );

  // Handle connection/edge property updates
  const handleEdgeUpdate = useCallback(
    (actionConfig: ActionConfig) => {
      if (!selectedEdge) return;

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === selectedEdge.id) {
            const updatedEdge: Edge = {
              ...edge,
              data: { ...edge.data, actionConfig },
            };
            // Update selectedEdge reference
            setSelectedEdge(updatedEdge);
            return updatedEdge;
          }
          return edge;
        })
      );
    },
    [selectedEdge, setEdges]
  );

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('nodeType') as WorkflowNodeType;
      const statePresetKey = event.dataTransfer.getData('statePreset');
      if (!nodeType || !reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let nodeLabel = nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/_/g, ' ');
      let nodeConfig = getDefaultNodeConfig(nodeType);

      // If it's a state with a preset, apply the preset configuration
      if (nodeType === 'state' && statePresetKey) {
        const preset = STATE_PRESETS.find((p) => p.key === statePresetKey);
        if (preset) {
          nodeLabel = preset.name;
          nodeConfig = {
            name: preset.name,
            stateKey: preset.stateKey,
            color: preset.color,
            isInitial: preset.isInitial,
            isFinal: preset.isFinal,
            allowEdit: preset.defaultPermissions.editMainForm,
            permissions: preset.defaultPermissions,
          };
        }
      }

      const newNode: WorkflowNode = {
        id: `${nodeType}_${statePresetKey || ''}_${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          nodeType,
          label: nodeLabel,
          config: nodeConfig,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;

    // Check if this is an initial state (Draft) - warn but allow deletion
    const config = selectedNode.data.config as Record<string, unknown>;
    if (config?.isInitial) {
      // Still allow deletion but show a warning
      setError('Warning: You deleted the initial state. Add a new Draft state for the workflow to work.');
    }

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Save workflow
  const handleSave = async () => {
    if (!workflowId) return;

    setSaving(true);
    setError(null);

    try {
      const graphData = {
        workflowId,
        nodes: nodes.map((n) => ({
          id: n.id,
          workflowId,
          type: n.data.nodeType,
          label: n.data.label,
          position: n.position,
          config: n.data.config,
        })),
        connections: edges.map((e) => ({
          id: e.id,
          workflowId,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          sourceOutput: e.sourceHandle || 'output',
          targetInput: e.targetHandle || 'input',
          actionConfig: e.data?.actionConfig as ActionConfig | undefined,
        })),
      };

      await workflowGraphApi.save(workflowId, graphData);
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  // Create a wrapper object for PropertiesPanel
  const selectedNodeForPanel = selectedNode
    ? {
        id: selectedNode.id,
        nodeType: selectedNode.data.nodeType,
        label: selectedNode.data.label,
        config: selectedNode.data.config,
      }
    : null;

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#fff',
        }}
      >
        <IconButton size="small" onClick={() => navigate('/workflows')}>
          <ArrowBack fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {workflow?.name || 'Workflow Builder'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
            Drag nodes from the palette • Connect by dragging from handles
          </Typography>
        </Box>

        {/* Zoom Controls */}
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={() => zoomIn()}>
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={() => zoomOut()}>
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit View">
          <IconButton size="small" onClick={() => fitView()}>
            <CenterFocusStrong fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {saving && <Chip label="Saving..." size="small" sx={{ fontSize: '0.6rem' }} />}

        <Button
          variant="outlined"
          size="small"
          startIcon={<PlayArrow fontSize="small" />}
          onClick={() => setPreviewOpen(true)}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          Preview
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<Save fontSize="small" />}
          onClick={handleSave}
          disabled={saving}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          Save
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 0 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Node Palette */}
        <Box
          sx={{
            width: 180,
            borderRight: '1px solid #e0e0e0',
            overflow: 'auto',
            bgcolor: '#fafafa',
          }}
        >
          <NodePalette
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />
        </Box>

        {/* Center - React Flow Canvas */}
        <Box ref={reactFlowWrapper} sx={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick as any}
            onEdgeClick={onEdgeClick as any}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes as any}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: 'smoothstep',
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ccc" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </Box>

        {/* Right Panel - Properties */}
        <Box
          sx={{
            width: 280,
            borderLeft: '1px solid #e0e0e0',
            bgcolor: '#fff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Show either Node Properties or Connection Properties */}
          {selectedEdge ? (
            // Connection Properties Panel
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid #eee', bgcolor: '#2196f3' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                  Connection Properties
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
                  Configure approval action button
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
                <ConnectionProperties
                  connection={{
                    id: selectedEdge.id,
                    sourceNodeId: selectedEdge.source,
                    targetNodeId: selectedEdge.target,
                    actionConfig: selectedEdge.data?.actionConfig as ActionConfig | undefined,
                  }}
                  sourceNodeType={nodes.find((n) => n.id === selectedEdge.source)?.data.nodeType || ''}
                  targetNodeType={nodes.find((n) => n.id === selectedEdge.target)?.data.nodeType || ''}
                  onUpdate={handleEdgeUpdate}
                />
              </Box>
              {/* Delete connection button */}
              <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => {
                    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
                    setSelectedEdge(null);
                  }}
                  sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                >
                  Delete Connection
                </Button>
              </Box>
            </Box>
          ) : (
            // Node Properties Panel
            <>
              <PropertiesPanel
                selectedNode={selectedNodeForPanel as any}
                onUpdate={handleNodeUpdate}
                formFields={formFields}
                roles={roles}
                users={users}
                childForms={childForms}
              />

              {/* Delete button */}
              {selectedNode && (
                <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleDeleteNode}
                    sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                  >
                    Delete Node
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Workflow Preview Dialog */}
      <WorkflowPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        nodes={nodes}
        edges={edges}
        workflowName={workflow?.name || 'Workflow'}
      />
    </Box>
  );
}

// Wrapper component with ReactFlowProvider
export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
}
