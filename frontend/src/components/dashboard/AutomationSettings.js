// src/components/dashboard/AutomationSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AutomationSettings = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // This function runs when the component first loads
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                // API call to get the user's current setting
                const res = await axios.get('http://localhost:5000/api/user/settings', config);
                setIsEnabled(res.data.isAutomationEnabled);
            } catch (err) {
                setError('Could not load automation settings.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []); // The empty array means this effect runs only once

    const handleToggle = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            // API call to update the setting on the backend
            const res = await axios.put('http://localhost:5000/api/user/settings/toggle-automation', {}, config);
            // Update the UI with the new setting from the server's response
            setIsEnabled(res.data.isAutomationEnabled);
        } catch (err) {
            setError('Could not update setting.');
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="p-6 mt-8 bg-white rounded-lg shadow-md animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
             <h3 className="text-lg font-semibold text-gray-700">Automation Settings</h3>
             {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
             <div className="flex items-center justify-between mt-4">
                <p className="text-gray-600">Enable automatic background processing and replies.</p>
                <button 
                    onClick={handleToggle} 
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
             </div>
        </div>
    );
};

export default AutomationSettings;