import React, { useState, useEffect } from 'react';
import { TaskService, TaskOverviewData } from '../../services/task'; // Adjust path
import { AxiosError } from 'axios';
import { StatCard } from '../common/StatCard'; // Assuming a reusable StatCard component exists
import { Bar } from 'react-chartjs-2'; // Example chart library
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartJsTooltip, // Aliased Chart.js Tooltip
    Legend,
    ArcElement, // For Doughnut
} from 'chart.js';
import { Task } from '@/types'; // Assuming Task type is available
import { Link as RouterLink } from 'react-router-dom'; // Aliased to avoid conflict
import dayjs from 'dayjs';
import ModernDashboardLayout from './ModernDashboardLayout'; // Added
import Sidebar from '../Sidebar'; // Added
import DashboardTopBar from './DashboardTopBar'; // Added
import { useTheme } from '@mui/material/styles'; // Added for drawerWidth
import { useMediaQuery, IconButton, Box, Tooltip as MuiTooltip } from '@mui/material'; // Added for drawerWidth logic and IconButton
import { useSelector } from 'react-redux'; // Added to get user info
import { RootState } from '../../store'; // Added to get user info
import TaskDetailsDialog from '../tasks/TaskDetailsDialog'; // Added
import VisibilityIcon from '@mui/icons-material/Visibility'; // Added for view details icon

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    ChartJsTooltip, // Use aliased Chart.js Tooltip
    Legend
);

const DRAWER_WIDTH = 240; // Standard drawer width, can be adjusted or imported from a shared constant

const TaskOverview: React.FC = () => {
    const [overviewData, setOverviewData] = useState<TaskOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme(); // Added
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Added
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Sidebar open by default on desktop, closed on mobile
    const { user } = useSelector((state: RootState) => state.auth); // Get user from Redux
    const [notificationCount, setNotificationCount] = useState(0); // Placeholder

    // State for TaskDetailsDialog
    const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleLogout = () => {
        // TODO: Implement actual logout logic (e.g., dispatch Redux action)
        console.log('Logout action triggered');
    };

    const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
        // TODO: Implement notification panel logic
        console.log('Notifications clicked', event.currentTarget);
    };
    
    const handleProfileClick = () => {
        // TODO: Implement profile navigation or dialog
        console.log('Profile clicked');
    };

    const handleSettingsClick = () => {
        // TODO: Implement settings navigation
        console.log('Settings clicked');
    };
    
    const handleHelpClick = () => {
        // TODO: Implement help/support action
        console.log('Help clicked');
    };

    const handleToggleTopWidgets = () => {
        // TODO: Implement if top widgets are used
        console.log('Toggle top widgets');
    };

    const fetchOverviewData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await TaskService.getTasksOverview();
            setOverviewData(data);
            // Placeholder for actual notification count if available from overviewData or another source
            // For example: setNotificationCount(data.userStats.reduce((acc, u) => acc + (u.unreadNotifications || 0), 0));
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Failed to load task overview data.';
            setError(errorMessage);
            console.error('Error fetching task overview:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOverviewData();
    }, []);
    
    useEffect(() => {
        // Adjust sidebar visibility on resize
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    // --- Handlers for TaskDetailsDialog ---
    const handleOpenTaskDetails = (taskId: string) => {
        setSelectedTaskId(taskId);
        setIsTaskDetailsOpen(true);
    };

    const handleCloseTaskDetails = () => {
        setSelectedTaskId(null);
        setIsTaskDetailsOpen(false);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        console.log('Task updated in dialog:', updatedTask);
        // Refresh overview data to reflect changes
        fetchOverviewData(); 
        // More sophisticated state update could be done here to avoid full refetch
        // For example, updating the specific task in overviewData.overdueTasks if it exists there
    };

    // --- Chart Data Preparation ---
    const departmentBarData = {
        labels: overviewData?.departmentStats?.map(d => d.departmentName) || [],
        datasets: [
            {
                label: 'Pending Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.pending) || [],
                backgroundColor: 'rgba(255, 159, 64, 0.7)', // Orange
            },
            {
                label: 'In Progress Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.inProgress) || [],
                backgroundColor: 'rgba(54, 162, 235, 0.7)', // Blue
            },
            {
                label: 'Completed Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.completed) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.7)', // Green
            },
             {
                label: 'Overdue Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.overdue) || [],
                backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red
            },
        ],
    };

     const userBarData = {
        labels: overviewData?.userStats?.map(u => u.username) || [],
        datasets: [
            {
                label: 'Assigned Tasks',
                data: overviewData?.userStats?.map(u => u.counts.totalAssigned) || [],
                backgroundColor: 'rgba(153, 102, 255, 0.7)', // Purple
            },
            {
                label: 'Completed Tasks',
                data: overviewData?.userStats?.map(u => u.counts.completed) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.7)', // Green
            },
             {
                label: 'Overdue Tasks',
                data: overviewData?.userStats?.map(u => u.counts.overdue) || [],
                backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red
            },
        ],
    };

    // --- Glassmorphism Style Objects (can be moved to a separate file/theme later) ---
    const glassCardStyle = {
        background: 'rgba(255, 255, 255, 0.08)', // Adjusted for component cards
        backdropFilter: 'blur(10px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fafafa', // Assuming ModernDashboardLayout provides a dark background
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        p: {xs: 2, md: 3} 
    };

    // --- Component Render ---
    const mainContent = (
        <>
            {isLoading && <div className="flex justify-center items-center h-64"><p className="text-white">Loading task overview...</p></div>}
            {error && <div className="text-center text-red-400 p-4">Error loading data: {error}</div>}
            {!isLoading && !error && !overviewData && <div className="text-center p-4 text-gray-400">No task overview data available.</div>}
            {!isLoading && !error && overviewData && (
                <div className="p-1 md:p-2 lg:p-4 space-y-4"> {/* Reduced padding for tighter fit, adjust as needed */}
                    <h1 className="text-xl md:text-2xl font-semibold text-white mb-4">Task Overview</h1>

                    {/* Overall Stats Cards with Glassmorphism */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
                        <Box sx={glassCardStyle}><StatCard title="Total Tasks" value={overviewData.overallCounts.totalTasks} /></Box>
                        <Box sx={glassCardStyle}><StatCard title="Pending" value={overviewData.overallCounts.pending} /></Box>
                        <Box sx={glassCardStyle}><StatCard title="In Progress" value={overviewData.overallCounts.inProgress} /></Box>
                        <Box sx={glassCardStyle}><StatCard title="Completed" value={overviewData.overallCounts.completed} /></Box>
                        <Box sx={glassCardStyle}><StatCard title="Overdue" value={overviewData.overallCounts.overdue} /></Box>
                    </div>

                    {/* Charts Section with Glassmorphism */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                        <Box sx={glassCardStyle}>
                            <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Tasks by Department</h2>
                            {overviewData.departmentStats && overviewData.departmentStats.length > 0 ? (
                                <Bar
                                    data={departmentBarData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top' as const,
                                                labels: { color: '#fff' },
                                            },
                                            title: { display: false },
                                        },
                                        scales: {
                                            x: {
                                                stacked: true,
                                                ticks: { color: '#fff' },
                                            },
                                            y: {
                                                stacked: true,
                                                ticks: { color: '#fff' },
                                            },
                                        },
                                    }}
                                />
                            ) : (
                                <p className="text-gray-400">No department task data available.</p>
                            )}
                        </Box>

                        <Box sx={glassCardStyle}>
                            <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Tasks by User</h2>
                            {overviewData.userStats && overviewData.userStats.length > 0 ? (
                                <Bar
                                    data={userBarData}
                                    options={{
                                        responsive: true,
                                        indexAxis: 'y' as const,
                                        plugins: {
                                            legend: {
                                                position: 'top' as const,
                                                labels: { color: '#fff' },
                                            },
                                            title: { display: false },
                                        },
                                        scales: {
                                            x: {
                                                stacked: true,
                                                ticks: { color: '#fff' },
                                            },
                                            y: {
                                                stacked: true,
                                                ticks: { color: '#fff' },
                                            },
                                        },
                                    }}
                                />
                            ) : (
                                <p className="text-gray-400">No user task data available.</p>
                            )}
                        </Box>
                    </div>

                    {/* Overdue Tasks List with Glassmorphism and View Details Button */}
                    <Box sx={glassCardStyle}>
                        <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Overdue Tasks ({overviewData.overdueTasks?.length || 0})</h2>
                        {overviewData.overdueTasks && overviewData.overdueTasks.length > 0 ? (
                            <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
                                {overviewData.overdueTasks.map((task: Task) => (
                                    <li 
                                        key={task.id} 
                                        className="py-2 px-1 hover:bg-white/10 rounded flex justify-between items-center cursor-pointer"
                                        onClick={() => handleOpenTaskDetails(task.id)}
                                    >
                                        <div className="flex-grow">
                                            <span className="font-medium text-gray-200 truncate pr-2">{task.title}</span>
                                            <span className="text-red-400 whitespace-nowrap ml-2">
                                                Due: {task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : 'N/A'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No overdue tasks. Great job!</p>
                        )}
                    </Box>
                </div>
            )}
        </>
    );
    
    return (
        <React.Fragment>
            <ModernDashboardLayout
                sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleSidebarToggle} onLogout={handleLogout} drawerWidth={DRAWER_WIDTH}/>}
                topBar={<DashboardTopBar 
                            username={user?.username || 'User'} 
                            notificationCount={notificationCount} 
                            onToggleSidebar={handleSidebarToggle} 
                            onNotificationClick={handleNotificationsClick}
                            onLogout={handleLogout}
                            onProfileClick={handleProfileClick}
                            onSettingsClick={handleSettingsClick}
                            onHelpClick={handleHelpClick}
                            onToggleTopWidgets={handleToggleTopWidgets}
                            topWidgetsVisible={false} // Placeholder, manage if needed
                        />}
                mainContent={mainContent}
                sidebarOpen={sidebarOpen}
                drawerWidth={DRAWER_WIDTH}
            />
            <TaskDetailsDialog 
                taskId={selectedTaskId}
                open={isTaskDetailsOpen}
                onClose={handleCloseTaskDetails}
                onTaskUpdate={handleTaskUpdated}
            />
        </React.Fragment>
    );
};

export default TaskOverview; 