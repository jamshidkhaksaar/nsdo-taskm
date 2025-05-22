import React, { useCallback, useEffect, useState } from 'react';
import { Typography, Paper, Box, CircularProgress, Alert, Tooltip, IconButton } from '@mui/material';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Node, 
  Edge, 
  Connection, 
  MarkerType,
  NodeProps,
  EdgeProps,
  Position,
  BackgroundVariant,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axiosInstance from '../../../../utils/axios'; // Adjust path to your axios instance
import { HelpOutline } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useSelector, useDispatch } from 'react-redux'; // Added Redux hooks
import { RootState, AppDispatch } from '@/store'; // Added RootState and AppDispatch
import { logout } from '@/store/slices/authSlice'; // Added logout action
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout'; // Added ModernDashboardLayout
import Sidebar from '@/components/Sidebar'; // Added Sidebar
import DashboardTopBar from '@/components/dashboard/DashboardTopBar'; // Added DashboardTopBar

// Interfaces matching backend DTOs
interface WorkflowStepNodeData {
  label: string;
  description?: string;
  permissionIdentifier: string;
  type: 'step';
}

interface RoleNodeData {
  label: string;
  description?: string;
  type: 'role';
}

export interface WorkflowStepNodeDto {
  id: string;
  name: string;
  description?: string;
  permissionIdentifier: string;
  order: number;
}

export interface RoleNodeDto {
  id: string;
  name: string;
  description?: string;
}

export interface PermissionEdgeDto {
  roleId: string;
  workflowStepId: string;
  hasPermission: boolean;
}

export interface WorkflowVisualizerDataDto {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  steps: WorkflowStepNodeDto[];
  roles: RoleNodeDto[];
  permissions: PermissionEdgeDto[];
}

// Custom Node Types (Optional, but good for styling/custom data)
const RoleNodeComponent: React.FC<NodeProps<RoleNodeData>> = ({ data }) => {
  return (
    // <Tooltip title={data.description || data.label}> // Temporarily remove Tooltip for testing
      <Paper 
        elevation={3} 
        sx={{ 
          padding: '10px 15px',
          borderRadius: '8px',
          background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
          boxShadow: '5px 5px 10px #c8c8c8, -5px -5px 10px #ffffff',
          border: '1px solid #d0d0d0',
          minWidth: 150,
          textAlign: 'center',
          position: 'relative',
          overflow: 'visible' 
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#212121' }}>{data.label}</Typography>
        <Typography variant="caption" display="block" sx={{color: '#424242'}}>(Role)</Typography>
        <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      </Paper>
    // </Tooltip>
  );
};

const StepNodeComponent: React.FC<NodeProps<WorkflowStepNodeData>> = ({ data }) => {
  return (
    // <Tooltip title={data.description || data.label}> // Temporarily remove Tooltip for testing
      <Paper 
        elevation={3} 
        sx={{ 
          padding: '10px 15px',
          borderRadius: '8px',
          background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
          boxShadow: '5px 5px 10px #c8c8c8, -5px -5px 10px #ffffff',
          border: '1px solid #d0d0d0',
          minWidth: 200,
          textAlign: 'center',
          position: 'relative',
          overflow: 'visible' 
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#212121' }}>{data.label}</Typography>
        <Typography variant="caption" display="block" sx={{color: '#424242'}}>{data.permissionIdentifier}</Typography>
        <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
        {/* If steps can also be a source for other connections, add a source handle */}
        {/* <Handle type="source" position={Position.Right} style={{ background: '#555' }} /> */}
      </Paper>
    // </Tooltip>
  );
};

const nodeTypes = {
  roleNode: RoleNodeComponent,
  stepNode: StepNodeComponent,
};

// Define a specific type for our nodes
type AppNodeType = Node<RoleNodeData | WorkflowStepNodeData>;

const WorkflowVisualizerPage: React.FC = () => {
  const { workflowSlug } = useParams<{ workflowSlug: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState<RoleNodeData | WorkflowStepNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [workflowData, setWorkflowData] = useState<WorkflowVisualizerDataDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // State and handlers for ModernDashboardLayout
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarOpenState');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleDrawerToggle = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpenState', JSON.stringify(newState));
      return newState;
    });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    if (!workflowSlug) {
      setError('Workflow slug not provided in URL.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const response = await axiosInstance.get<WorkflowVisualizerDataDto>(`/admin/workflows/${workflowSlug}/visualize`);
      setWorkflowData(response.data);
    } catch (err: any) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to load workflow data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [workflowSlug, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (workflowData) {
      const roleNodes: Node<RoleNodeData>[] = workflowData.roles.map((role, index) => ({
        id: `role-${role.id}`,
        type: 'roleNode',
        data: { label: role.name, description: role.description || role.name, type: 'role' },
        position: { x: 50, y: index * 120 + 50 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }));

      const stepNodes: Node<WorkflowStepNodeData>[] = workflowData.steps.map((step, index) => ({
        id: `step-${step.id}`,
        type: 'stepNode',
        data: { label: step.name, description: step.description || step.name, permissionIdentifier: step.permissionIdentifier, type: 'step' },
        position: { x: 450, y: index * 100 + 50 },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
      }));
      
      // Use the alias for the combined array type
      const allNodes: AppNodeType[] = [...roleNodes, ...stepNodes];
      setNodes(allNodes);

      const permissionEdges: Edge[] = workflowData.permissions
        .filter(p => p.hasPermission) // Only show existing permissions initially
        .map(p => ({
          id: `edge-${p.roleId}-${p.workflowStepId}`,
          source: `role-${p.roleId}`,
          target: `step-${p.workflowStepId}`,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#555',
          },
          style: { stroke: '#555', strokeWidth: 2 }
        }));
      setEdges(permissionEdges);
    }
  }, [workflowData, setNodes, setEdges]);

  const updatePermission = async (roleId: string, workflowStepId: string, hasPermission: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await axiosInstance.post('/admin/workflows/permissions', {
        roleId,
        workflowStepId,
        hasPermission,
      });
      // Optionally, refetch data or update local state more granularly
      // For simplicity, we can rely on the visual feedback of edge add/remove
    } catch (err: any) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission: ' + (err.response?.data?.message || err.message));
      // If update fails, we might need to revert the edge change visually
      // For now, an error message is shown.
      fetchData(); // Refetch to ensure UI consistency after error
    } finally {
      setSaving(false);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const sourceId = connection.source.replace('role-', '');
        const targetId = connection.target.replace('step-', '');
        
        // Ensure not connecting step to role or role to role etc.
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        if (sourceNode?.data.type === 'role' && targetNode?.data.type === 'step') {
            setEdges((eds) => addEdge({ 
                ...connection, 
                animated: true, 
                markerEnd: { type: MarkerType.ArrowClosed, width:20, height:20, color: '#555'}, 
                style: { stroke: '#555', strokeWidth: 2 }
            }, eds));
            updatePermission(sourceId, targetId, true);
        } else {
            console.warn('Invalid connection attempt:', connection);
        }
      }
    },
    [setEdges, nodes, updatePermission]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach(edge => {
        if (edge.source && edge.target) {
          const roleId = edge.source.replace('role-', '');
          const workflowStepId = edge.target.replace('step-', '');
          updatePermission(roleId, workflowStepId, false);
        }
      });
    },
    [updatePermission]
  );

  if (loading && !workflowData) return ( // Ensure loading state is for initial load primarily
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  
  if (!workflowSlug && !loading) {
    // This condition might be better handled by a redirect or a specific page component
    // For now, let's assume workflowSlug will be present due to routing.
    // If it can be absent, the layout might need to be different.
    const errorContent = (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Alert severity="warning">No workflow selected. Please ensure the URL includes a workflow identifier.</Alert>
        </Box>
    );
    return (
        <ModernDashboardLayout
            sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleDrawerToggle} onLogout={handleLogout} />}
            topBar={<DashboardTopBar onToggleSidebar={handleDrawerToggle} username={user?.username || 'User'} notificationCount={0} onNotificationClick={() => {}} onLogout={handleLogout} onProfileClick={() => navigate('/profile')} onSettingsClick={() => navigate('/settings')} onHelpClick={() => {}} onToggleTopWidgets={() => {}} topWidgetsVisible={true} showQuickNotesButton={false} />}
            mainContent={errorContent}
            sidebarOpen={sidebarOpen}
            drawerWidth={240}
        />
    );
  }

  const sidebarElement = <Sidebar 
                            open={sidebarOpen} 
                            onToggleDrawer={handleDrawerToggle}
                            onLogout={handleLogout}
                          />;
  const topBarElement = <DashboardTopBar 
                            onToggleSidebar={handleDrawerToggle}
                            username={user?.username || 'User'}
                            notificationCount={0} // Replace with actual data if available
                            onNotificationClick={() => {}} // Replace with actual handler
                            onLogout={handleLogout}
                            onProfileClick={() => navigate('/profile')}
                            onSettingsClick={() => navigate('/settings')}
                            onHelpClick={() => {}} // Replace with actual handler
                            onToggleTopWidgets={() => {}} // Replace if top widgets are used
                            topWidgetsVisible={true} // Adjust as needed
                            showQuickNotesButton={false} // Adjust as needed
                          />;

  // Log state before rendering main content
  console.log('[WorkflowVisualizerPage] State before mainContent render:', { workflowSlug, loading, error, workflowData, nodes, edges });

  const mainContentElement = (
    <Box sx={{ 
      p: 3, 
      height: '100%', // Take full height from ModernDashboardLayout's slot
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 /* Prevent titles from shrinking */ }}>
        <Typography variant="h4" component="h1" sx={{ color: '#fff' /* Apply consistent title color */ }}>
          Workflow: {workflowData?.workflowName || workflowSlug}
        </Typography>
        <Tooltip title="Connect roles to workflow steps to grant permissions. Drag an edge off a connection or select an edge and press delete to remove a permission. Changes are saved automatically.">
          <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}><HelpOutline /></IconButton>
        </Tooltip>
      </Box>
      <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3, flexShrink: 0 /* Prevent titles from shrinking */ }}>
        Visualize and manage permissions for the steps within this workflow.
      </Typography>
      
      {error && !loading && <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper 
        sx={{ 
          flexGrow: 1, // Ensure Paper takes available space
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          // Consistent glassmorphism from RBACManagement
          borderRadius: '10px', 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          // Remove explicit height, rely on flexbox to fill space from ModernDashboardLayout
        }}
      >
        {saving && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(255, 255, 255, 0.7)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              zIndex: 10, // Ensure overlay is on top of ReactFlow
              flexDirection: 'column',
              borderRadius: 'inherit', // Inherit border radius from Paper
            }}
          >
            <CircularProgress />
            <Typography sx={{mt: 1}}>Saving...</Typography>
          </Box>
        )}
        {/* Box to contain ReactFlow and allow it to take full space of Paper */} 
        {/* This Box will now also be a flex item that grows */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 'inherit', position: 'relative' }}> 
            {loading && !workflowData && ( // Show loader inside paper if content is still loading after initial page load
                 <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' /* Removed minHeight */ }}>
                    <CircularProgress />
                    <Typography sx={{ml: 2, color: 'rgba(255,255,255,0.7)'}}>Loading workflow...</Typography>
                 </Box>
            )}
            {!loading && workflowData && ( // Only render ReactFlow when data is available and not loading
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              </ReactFlow>
            )}
          </Box>
      </Paper>
    </Box>
  );

  return (
    <ModernDashboardLayout
      sidebar={sidebarElement}
      topBar={topBarElement}
      mainContent={mainContentElement}
      sidebarOpen={sidebarOpen}
      drawerWidth={240} // Assuming default drawer width, adjust if needed
    />
  );
};

export default WorkflowVisualizerPage; 