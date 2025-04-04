import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// API URL - use environment variable in production or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PaymentModal({ onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Starting payment process...");
      console.log("API URL:", `${API_URL}/api/create-payment-intent`);
      
      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 3000 }),
      });
      
      // Log the entire response for debugging
      const responseData = await response.json();
      console.log("API Response:", responseData);
      
      if (!responseData.clientSecret) {
        console.error("No client secret in response:", responseData);
        throw new Error("Server did not return a client secret");
      }
      
      const clientSecret = responseData.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        await fetch(`${API_URL}/api/register-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        localStorage.setItem('userEmail', email);
        
        // Fetch the updated data before calling onSuccess
        await fetchFullData(email);
        
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error details:', err);
      setError('An error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  // Function to fetch the full data after payment
  const fetchFullData = async (email) => {
    const url = `${API_URL}/api/preview-data?email=${encodeURIComponent(email)}`;
    await fetch(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-600">Get Lifetime Access</h2>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">
            Complete $30 Payment
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Card Details</label>
            <CardElement
              className="w-full p-3 border rounded-lg"
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                    padding: '16px',
                  },
                },
              }}
            />
          </div>

          {error && (
            <div className="text-red-600 mb-4 text-center">{error}</div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : 'Pay $30'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal; 