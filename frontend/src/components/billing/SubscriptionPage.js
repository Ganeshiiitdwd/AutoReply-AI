// src/components/billing/SubscriptionPage.js
import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const SubscriptionPage = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (!error) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const { data } = await axios.post(
          'http://localhost:5000/api/stripe/create-subscription',
          {
            paymentMethodId: paymentMethod.id,
            priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID, // default plan
          },
          config
        );
        alert('Subscription successful!');
      } catch (err) {
        console.error(err);
        alert('Subscription failed.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Subscribe to <span className="text-indigo-600">Pro Plan</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-3 bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#32325d',
                    '::placeholder': { color: '#a0aec0' },
                  },
                  invalid: { color: '#fa755a' },
                },
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!stripe}
            className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Subscribe
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Secure payments powered by <span className="font-semibold">Stripe</span>.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
