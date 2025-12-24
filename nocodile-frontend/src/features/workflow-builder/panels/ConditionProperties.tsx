import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { ConditionRule, ConditionExpression } from '../types';

const OPERATORS = [
  { value: '==', label: 'equals (==)' },
  { value: '!=', label: 'not equals (!=)' },
  { value: '>', label: 'greater than (>)' },
  { value: '<', label: 'less than (<)' },
  { value: '>=', label: 'greater or equal (>=)' },
  { value: '<=', label: 'less or equal (<=)' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'in list' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
];

interface ConditionPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string }>;
}

export function ConditionProperties({
  config,
  onUpdate,
  formFields,
}: ConditionPropertiesProps) {
  const conditionType = (config.conditionType as string) || 'field';
  const conditions = (config.conditions as ConditionRule[]) || [];
  const defaultBranch = (config.defaultBranch as string) || 'else';

  const addConditionRule = () => {
    const newRule: ConditionRule = {
      id: `rule_${Date.now()}`,
      name: `Branch ${conditions.length + 1}`,
      rules: [],
      logicalOperator: 'AND',
      targetBranch: `branch_${conditions.length}`,
    };
    onUpdate({ conditions: [...conditions, newRule] });
  };

  const updateRule = (index: number, updates: Partial<ConditionRule>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({ conditions: newConditions });
  };

  const removeRule = (index: number) => {
    onUpdate({ conditions: conditions.filter((_, i) => i !== index) });
  };

  const addExpression = (ruleIndex: number) => {
    const newExpression: ConditionExpression = {
      leftOperand: { type: 'field', value: '' },
      operator: '==',
      rightOperand: { type: 'constant', value: '' },
    };
    const newConditions = [...conditions];
    newConditions[ruleIndex] = {
      ...newConditions[ruleIndex],
      rules: [...newConditions[ruleIndex].rules, newExpression],
    };
    onUpdate({ conditions: newConditions });
  };

  const updateExpression = (
    ruleIndex: number,
    exprIndex: number,
    updates: Partial<ConditionExpression>
  ) => {
    const newConditions = [...conditions];
    const newRules = [...newConditions[ruleIndex].rules];
    newRules[exprIndex] = { ...newRules[exprIndex], ...updates };
    newConditions[ruleIndex] = { ...newConditions[ruleIndex], rules: newRules };
    onUpdate({ conditions: newConditions });
  };

  const removeExpression = (ruleIndex: number, exprIndex: number) => {
    const newConditions = [...conditions];
    newConditions[ruleIndex] = {
      ...newConditions[ruleIndex],
      rules: newConditions[ruleIndex].rules.filter((_, i) => i !== exprIndex),
    };
    onUpdate({ conditions: newConditions });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Condition Type</InputLabel>
        <Select
          value={conditionType}
          onChange={(e) => onUpdate({ conditionType: e.target.value })}
          label="Condition Type"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="field" sx={{ fontSize: '0.75rem' }}>
            Based on Form Field
          </MenuItem>
          <MenuItem value="user_attribute" sx={{ fontSize: '0.75rem' }}>
            Based on User Attribute
          </MenuItem>
          <MenuItem value="expression" sx={{ fontSize: '0.75rem' }}>
            Custom Expression
          </MenuItem>
        </Select>
      </FormControl>

      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Condition Branches</Typography>

      {conditions.map((rule, ruleIndex) => (
        <Box
          key={rule.id}
          sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fafafa' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              label="Branch Name"
              value={rule.name}
              onChange={(e) => updateRule(ruleIndex, { name: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: '0.7rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.7rem' } }}
            />
            <FormControl size="small" sx={{ minWidth: 70 }}>
              <Select
                value={rule.logicalOperator}
                onChange={(e) =>
                  updateRule(ruleIndex, { logicalOperator: e.target.value as 'AND' | 'OR' })
                }
                sx={{ fontSize: '0.7rem' }}
              >
                <MenuItem value="AND" sx={{ fontSize: '0.7rem' }}>AND</MenuItem>
                <MenuItem value="OR" sx={{ fontSize: '0.7rem' }}>OR</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              color="error"
              onClick={() => removeRule(ruleIndex)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>

          {rule.rules.map((expr, exprIndex) => (
            <Box key={exprIndex} sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
              {/* Left operand type */}
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={expr.leftOperand.type}
                  onChange={(e) =>
                    updateExpression(ruleIndex, exprIndex, {
                      leftOperand: { type: e.target.value as 'field' | 'user_attribute' | 'constant', value: '' },
                    })
                  }
                  sx={{ fontSize: '0.65rem' }}
                >
                  <MenuItem value="field" sx={{ fontSize: '0.65rem' }}>Field</MenuItem>
                  <MenuItem value="user_attribute" sx={{ fontSize: '0.65rem' }}>User</MenuItem>
                </Select>
              </FormControl>

              {/* Left operand value */}
              {expr.leftOperand.type === 'field' ? (
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={expr.leftOperand.value}
                    onChange={(e) =>
                      updateExpression(ruleIndex, exprIndex, {
                        leftOperand: { ...expr.leftOperand, value: e.target.value },
                      })
                    }
                    displayEmpty
                    sx={{ fontSize: '0.65rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select...</MenuItem>
                    {formFields.map((f) => (
                      <MenuItem key={f.fieldKey} value={f.fieldKey} sx={{ fontSize: '0.65rem' }}>
                        {f.config.label || f.fieldKey}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={expr.leftOperand.value}
                    onChange={(e) =>
                      updateExpression(ruleIndex, exprIndex, {
                        leftOperand: { ...expr.leftOperand, value: e.target.value },
                      })
                    }
                    displayEmpty
                    sx={{ fontSize: '0.65rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.65rem' }}>Select...</MenuItem>
                    <MenuItem value="submitter.department" sx={{ fontSize: '0.65rem' }}>
                      Submitter Department
                    </MenuItem>
                    <MenuItem value="submitter.role" sx={{ fontSize: '0.65rem' }}>
                      Submitter Role
                    </MenuItem>
                    <MenuItem value="submitter.manager" sx={{ fontSize: '0.65rem' }}>
                      Submitter Manager
                    </MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Operator */}
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                  value={expr.operator}
                  onChange={(e) =>
                    updateExpression(ruleIndex, exprIndex, {
                      operator: e.target.value as ConditionExpression['operator'],
                    })
                  }
                  sx={{ fontSize: '0.65rem' }}
                >
                  {OPERATORS.map((op) => (
                    <MenuItem key={op.value} value={op.value} sx={{ fontSize: '0.65rem' }}>
                      {op.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Right operand */}
              <TextField
                size="small"
                placeholder="Value"
                value={expr.rightOperand.value}
                onChange={(e) =>
                  updateExpression(ruleIndex, exprIndex, {
                    rightOperand: { type: 'constant', value: e.target.value },
                  })
                }
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontSize: '0.65rem' } }}
              />

              <IconButton
                size="small"
                onClick={() => removeExpression(ruleIndex, exprIndex)}
              >
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}

          <Button
            size="small"
            startIcon={<Add sx={{ fontSize: 12 }} />}
            onClick={() => addExpression(ruleIndex)}
            sx={{ fontSize: '0.6rem', textTransform: 'none', mt: 0.5 }}
          >
            Add Condition
          </Button>
        </Box>
      ))}

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add fontSize="small" />}
        onClick={addConditionRule}
        sx={{ fontSize: '0.65rem', textTransform: 'none' }}
      >
        Add Branch
      </Button>

      <FormControl fullWidth size="small" sx={{ mt: 1 }}>
        <InputLabel sx={{ fontSize: '0.75rem' }}>Default Branch (Else)</InputLabel>
        <Select
          value={defaultBranch}
          onChange={(e) => onUpdate({ defaultBranch: e.target.value })}
          label="Default Branch (Else)"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="else" sx={{ fontSize: '0.75rem' }}>Else (no match)</MenuItem>
          {conditions.map((rule) => (
            <MenuItem key={rule.id} value={rule.targetBranch} sx={{ fontSize: '0.75rem' }}>
              {rule.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default ConditionProperties;
