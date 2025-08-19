// src/components/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// --- All of your existing components ---
import ConnectGmail from './ConnectGmail';
import EmailList from './EmailList';
import AutomationSettings from './AutomationSettings';
import ActionLog from './ActionLog';
import SubscriptionStatus from './SubscriptionStatus';
// --- The new component for Sprint 9 ---
import AnalyticsDashboard from './AnalyticsDashboard';

export const Dashboard = () => {
  const [connectionStatus, setConnectionStatus] = useState('');
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('status') === 'google-connected') {
      setConnectionStatus('Your Google account has been successfully connected!');
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Navigation Bar (Unchanged) --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <h1 className="text-xl font-bold text-gray-800">AI Email Assistant</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/knowledge-base" className="px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100">
                Knowledge Base
              </Link>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content Area with Polished 2-Column Layout --- */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {connectionStatus && (
          <div className="p-4 mb-6 text-green-800 bg-green-100 border-l-4 border-green-500 rounded-md">
            <p className="font-bold">Success!</p>
            <p>{connectionStatus}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column: Settings & Actions --- */}
          <div className="lg:col-span-1 space-y-8">
            <SubscriptionStatus />
            <AutomationSettings />
            <ActionLog />
            <ConnectGmail />
          </div>
          
          {/* --- Right Column: Data & Analytics --- */}
          <div className="lg:col-span-2 space-y-8">
            <AnalyticsDashboard />
            <EmailList />
          </div>
        </div>
      </main>
    </div>
  );
};
