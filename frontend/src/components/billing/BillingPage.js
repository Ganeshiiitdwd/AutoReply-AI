// src/components/billing/BillingPage.js
import React from 'react';
import axios from 'axios';

const BillingPage = () => {
  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const { data } = await axios.post(
        'http://localhost:5000/api/stripe/create-customer-portal-session',
        {},
        config
      );
      window.location.href = data.url;
    } catch (error) {
      console.error("Error redirecting to billing portal");
      alert("Failed to redirect to billing portal. Try again later.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Billing Management
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Manage your subscription, payment methods, and invoices.
        </p>
        <button
          onClick={handleManageBilling}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium 
                     hover:bg-indigo-700 transition duration-200"
        >
          Manage Your Subscription
        </button>
      </div>
    </div>
  );
};

export default BillingPage;
