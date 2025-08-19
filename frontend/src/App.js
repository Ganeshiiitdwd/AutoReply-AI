// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Register } from './components/auth/Register.js';
import { Login } from './components/auth/Login.js';
import { Dashboard } from './components/dashboard/Dashboard.js';
import PrivateRoute from './components/routing/PrivateRoute.js';
import KnowledgeBaseManager from './components/knowledge/KnowledgeBaseManager.js'; // Import new component
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscriptionPage from './components/billing/SubscriptionPage.js'
import BillingPage from './components/billing/BillingPage.js'
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
function App() {
  return (
     <Router>
      <Elements stripe={stripePromise}>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/knowledge-base" element={<PrivateRoute><KnowledgeBaseManager /></PrivateRoute>} />
          <Route path="/subscribe" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
        </Routes>
      </Elements>
    </Router>
  );
}

export default App;
