import React, { useState, useEffect } from 'react';
import { TaskService, TaskOverviewData } from '../../services/task'; // Adjust path
import { AxiosError } from 'axios';
import { StatCard } from '../common/StatCard'; // Assuming a reusable StatCard component exists
import { Bar, Line } from 'react-chartjs-2'; // Example chart library
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement, // For Doughnut
} from 'chart.js';
import { Task } from '@/types'; // Assuming Task type is available
import { Link } from 'react-router-dom'; // For linking tasks

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const TaskOverview: React.FC = () => {
    const [overviewData, setOverviewData] = useState<TaskOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await TaskService.getTasksOverview();
                setOverviewData(data);
            } catch (err) {
                const axiosError = err as AxiosError<{ message?: string }>;
                const errorMessage = axiosError.response?.data?.message || 'Failed to load task overview data.';
                setError(errorMessage);
                console.error('Error fetching task overview:', errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Chart Data Preparation ---
    const departmentBarData = {
        labels: overviewData?.departmentStats?.map(d => d.departmentName) || [],
        datasets: [
            {
                label: 'Pending Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.pending) || [],
                backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange
            },
            {
                label: 'In Progress Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.inProgress) || [],
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
            },
            {
                label: 'Completed Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.completed) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
            },
             {
                label: 'Overdue Tasks',
                data: overviewData?.departmentStats?.map(d => d.counts.overdue) || [],
                backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
            },
        ],
    };

     const userBarData = {
        labels: overviewData?.userStats?.map(u => u.username) || [],
        datasets: [
            {
                label: 'Assigned Tasks',
                data: overviewData?.userStats?.map(u => u.counts.totalAssigned) || [],
                backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
            },
            {
                label: 'Completed Tasks',
                data: overviewData?.userStats?.map(u => u.counts.completed) || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
            },
             {
                label: 'Overdue Tasks',
                data: overviewData?.userStats?.map(u => u.counts.overdue) || [],
                backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
            },
        ],
    };

    // --- Component Render ---
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><p>Loading task overview...</p></div>; // Add a spinner later
    }

    if (error) {
        return <div className="text-center text-red-600 dark:text-red-400 p-4">Error loading data: {error}</div>;
    }

    if (!overviewData) {
        return <div className="text-center p-4">No task overview data available.</div>;
    }

    const { overallCounts, departmentStats, userStats, provinceStats, overdueTasks } = overviewData;

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white mb-6">Task Overview</h1>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard title="Total Tasks" value={overallCounts.totalTasks} color="bg-blue-500" />
                <StatCard title="Pending" value={overallCounts.pending} color="bg-yellow-500" />
                <StatCard title="In Progress" value={overallCounts.inProgress} color="bg-indigo-500" />
                <StatCard title="Completed" value={overallCounts.completed} color="bg-green-500" />
                <StatCard title="Overdue" value={overallCounts.overdue} color="bg-red-500" />
                {/* Add more cards as needed (Cancelled, Delegated, Due Today, Active Users, Total Depts) */}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Tasks Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Tasks by Department</h2>
                    {departmentStats && departmentStats.length > 0 ? (
                        <Bar
                            data={departmentBarData}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' }, title: { display: false } },
                                scales: { x: { stacked: true }, y: { stacked: true } },
                            }}
                        />
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No department task data available.</p>
                    )}
                </div>

                {/* User Tasks Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Tasks by User</h2>
                    {userStats && userStats.length > 0 ? (
                         <Bar
                            data={userBarData}
                            options={{
                                responsive: true,
                                indexAxis: 'y', // Horizontal bar chart for potentially many users
                                plugins: { legend: { position: 'top' }, title: { display: false } },
                                scales: { x: { stacked: true }, y: { stacked: true } }, // Adjust if not stacked
                            }}
                        />
                    ) : (
                         <p className="text-gray-500 dark:text-gray-400">No user task data available.</p>
                    )}
                </div>
            </div>

            {/* Overdue Tasks List */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Overdue Tasks ({overdueTasks?.length || 0})</h2>
                {overdueTasks && overdueTasks.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                        {overdueTasks.map((task: Task) => (
                            <li key={task.id} className="py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                <Link to={`/tasks/${task.id}`} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{task.title}</span>
                                    <span className="text-red-600 dark:text-red-400 whitespace-nowrap">
                                        Due: {task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : 'N/A'}
                                    </span>
                                    {/* Optionally show Assignee or Department */}
                                    {/* <span className='text-gray-500 dark:text-gray-400 ml-4 truncate'>{task.assignedToUsers?.[0]?.username || 'Unassigned'}</span> */}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No overdue tasks. Great job!</p>
                )}
            </div>

            {/* TODO: Add Province Stats display if needed */}

        </div>
    );
};

export default TaskOverview; 