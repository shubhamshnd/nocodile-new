import { Box, Typography, TextField, Divider, Tabs, Tab } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { useState } from 'react';
import { NODE_TYPE_INFO } from '../types';
import type { WorkflowNodeType } from '../types';
import { ApprovalProperties } from './ApprovalProperties';
import { StateProperties } from './StateProperties';
import { ConditionProperties } from './ConditionProperties';
import { EndProperties } from './EndProperties';
import { NotificationProperties } from './NotificationProperties';
import { TimerProperties } from './TimerProperties';
import { ViewPermissionProperties } from './ViewPermissionProperties';
import { ChildFormEntryProperties } from './ChildFormEntryProperties';
import { WebhookProperties } from './WebhookProperties';
import { ForkJoinProperties } from './ForkJoinProperties';

// Simple node data interface for the panel
interface SelectedNodeData {
  id: string;
  nodeType: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
}

interface PropertiesPanelProps {
  selectedNode: SelectedNodeData | null;
  onUpdate: (config: Record<string, unknown>) => void;
  formFields?: Array<{ fieldKey: string; config: { label?: string } }>;
  roles?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; firstName: string; lastName: string; username: string }>;
  childForms?: Array<{ id: string; name: string }>;
}

export function PropertiesPanel({
  selectedNode,
  onUpdate,
  formFields = [],
  roles = [],
  users = [],
  childForms = [],
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!selectedNode) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', height: '100%' }}>
        <Settings sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Select a node to edit its properties
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#999', mt: 1 }}>
          Click on any node in the canvas to configure it
        </Typography>
      </Box>
    );
  }

  const nodeInfo = NODE_TYPE_INFO[selectedNode.nodeType];
  const config = selectedNode.config;

  const updateConfig = (updates: Partial<Record<string, unknown>>) => {
    onUpdate({ ...config, ...updates });
  };

  const renderNodeProperties = () => {
    const commonProps = {
      config,
      onUpdate: updateConfig,
      formFields,
      roles,
      users,
    };

    switch (selectedNode.nodeType) {
      case 'start':
        return <StartProperties {...commonProps} />;
      case 'state':
        return <StateProperties {...commonProps} />;
      case 'end':
        return <EndProperties {...commonProps} />;
      case 'approval':
        return <ApprovalProperties {...commonProps} />;
      case 'condition':
        return <ConditionProperties {...commonProps} />;
      case 'notification':
        return <NotificationProperties {...commonProps} />;
      case 'timer':
        return <TimerProperties {...commonProps} />;
      case 'view_permission':
        return <ViewPermissionProperties {...commonProps} />;
      case 'child_form_entry':
        return <ChildFormEntryProperties {...commonProps} childForms={childForms} />;
      case 'email':
        return <NotificationProperties {...commonProps} isEmail />;
      case 'webhook':
        return <WebhookProperties {...commonProps} />;
      case 'fork':
      case 'join':
        return <ForkJoinProperties {...commonProps} nodeType={selectedNode.nodeType} />;
      default:
        return (
          <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
            No properties available for this node type.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1,
          borderBottom: '1px solid #eee',
          bgcolor: nodeInfo.color,
        }}
      >
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
          {(config.name as string) || nodeInfo.label}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
          {nodeInfo.description}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          minHeight: 32,
          borderBottom: '1px solid #eee',
          '& .MuiTab-root': {
            minHeight: 32,
            fontSize: '0.7rem',
            textTransform: 'none',
            py: 0.5,
          },
        }}
      >
        <Tab label="Settings" />
        {selectedNode.nodeType === 'approval' && <Tab label="Rules" />}
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {/* Common: Name field */}
        <TextField
          fullWidth
          size="small"
          label="Node Name"
          value={(config.name as string) || ''}
          onChange={(e) => updateConfig({ name: e.target.value })}
          sx={{ mb: 2 }}
          InputProps={{ sx: { fontSize: '0.8rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
        />

        <Divider sx={{ mb: 2 }} />

        {/* Node-specific properties */}
        {renderNodeProperties()}
      </Box>
    </Box>
  );
}

// Simple Start Properties
function StartProperties({}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        The Start node is the entry point of your workflow. It triggers when a form is submitted.
      </Typography>
    </Box>
  );
}

export default PropertiesPanel;
