// src/components/dashboard/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:5000/api/analytics/summary', config);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch analytics data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <p>Loading analytics...</p>;
    if (!data) return <p>No analytics data available.</p>;

    // Format date for the chart
    const chartData = data.dailyVolume.map(item => ({
        ...item,
        date: format(new Date(item.date), 'MMM d'),
    }));

    return (
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">Your Analytics</h3>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-indigo-100 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-800">Total Replies Sent</h4>
                    <p className="text-3xl font-bold text-indigo-900 mt-1">{data.totalProcessed}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800">Avg. Response Time</h4>
                    <p className="text-3xl font-bold text-green-900 mt-1">{data.averageResponseTime.toFixed(2)}s</p>
                </div>
                 <div className="p-4 bg-blue-100 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800">Emails Processed Today</h4>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{data.dailyVolume.slice(-1)[0]?.count || 0}</p>
                </div>
            </div>

            {/* Daily Volume Chart */}
            <h4 className="text-md font-semibold text-gray-600 mb-4">Emails Processed Per Day (Last 30 Days)</h4>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Emails Processed" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AnalyticsDashboard;