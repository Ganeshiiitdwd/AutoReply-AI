// src/components/dashboard/SubscriptionStatus.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubscriptionStatus = () => {
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                // This endpoint doesn't exist yet, we'll add it.
                const res = await axios.get('http://localhost:5000/api/stripe/subscription-status', config);
                setStatus(res.data.status);
            } catch (error) {
                console.log('No active subscription found.');
                setStatus('inactive');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleManageBilling = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const { data } = await axios.post('http://localhost:5000/api/stripe/create-customer-portal-session', {}, config);
            window.location.href = data.url;
        } catch (error) {
            console.error("Error redirecting to billing portal");
        }
    };

    if (isLoading) {
        return <div className="p-6 mt-8 bg-white rounded-lg shadow-md text-center">Loading Subscription Info...</div>;
    }

    return (
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Subscription</h3>
            <div className="flex items-center justify-between mt-4">
                {status === 'active' ? (
                    <>
                        <p className="text-gray-600">You have an active <span className="font-bold text-green-600">Pro Plan</span>.</p>
                        <button onClick={handleManageBilling} className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            Manage Billing
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600">Upgrade to the Pro Plan to unlock all features.</p>
                        <Link to="/subscribe" className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                            Subscribe Now
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default SubscriptionStatus;