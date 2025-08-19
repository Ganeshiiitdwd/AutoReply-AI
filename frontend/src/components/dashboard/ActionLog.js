// src/components/dashboard/ActionLog.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActionLog = () => {
    const [sheetId, setSheetId] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:5000/api/user/settings', config);
                setSheetId(res.data.spreadsheetId);
            } catch (error) {
                console.error("Could not fetch spreadsheet ID");
            }
        };
        fetchSettings();
    }, []);

    // Don't render anything if the user doesn't have a sheet yet
    if (!sheetId) {
        return null;
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

    return (
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
             <h3 className="text-lg font-semibold text-gray-700">Action Log</h3>
             <div className="flex items-center justify-between mt-4">
                <p className="text-gray-600">View a complete history of all AI-processed emails and replies.</p>
                <a 
                    href={sheetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                    Open Log Sheet
                </a>
             </div>
        </div>
    );
};

export default ActionLog;