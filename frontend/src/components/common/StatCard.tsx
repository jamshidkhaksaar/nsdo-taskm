import React from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    color?: string; // e.g., 'bg-blue-500', 'bg-green-500'
    icon?: React.ReactNode; // Optional icon component
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, color = 'bg-gray-500', icon }) => {
    return (
        <div className={`p-4 rounded-lg shadow-md ${color} text-white transition transform hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-2xl md:text-3xl font-semibold">{value}</p>
                </div>
                {icon && (
                    <div className="text-3xl opacity-80">
                        {icon}
                    </div>
                )}
            </div>
            {/* Add optional description or link below if needed */}
        </div>
    );
}; 