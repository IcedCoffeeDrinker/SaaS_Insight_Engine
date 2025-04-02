import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// API URL - use environment variable in production or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// SVG Icons (simple inline components)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// Accept onLogin prop for auto-login after payment
function PaymentModal({ onClose, onSuccess, onLogin }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState(''); // Add email state
  const [password, setPassword] = useState(''); // Add password state

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system not ready.");
      return;
    }
    if (!email || !password) {
        setError("Email and password are required.");
        return;
    }

    setLoading(true);
    setError(null);

    let clientSecret = null;

    try {
      // Step 1: Call backend to prepare payment (checks email, creates user, creates payment intent)
      console.log("Preparing payment for:", email);
      const prepareResponse = await fetch(`${API_URL}/api/prepare-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const prepareData = await prepareResponse.json();
      console.log("API Response (prepare-payment):", prepareData);

      if (!prepareResponse.ok) {
        // Handle errors like email already exists
        throw new Error(prepareData.message || "Failed to prepare payment.");
      }

      if (!prepareData.clientSecret) {
        throw new Error("Server did not return a client secret after preparation.");
      }

      clientSecret = prepareData.clientSecret;

      // Step 2: Confirm the card payment with Stripe
      console.log("Confirming card payment...");
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email: email, // Use the entered email
          },
        },
      });

      if (result.error) {
        console.error("Stripe payment confirmation error:", result.error);
        // Attempt to roll back user creation? Difficult from frontend.
        // Backend should ideally handle this if possible.
        throw new Error(result.error.message);
      }

      // Step 3: Handle successful payment confirmation
      if (result.paymentIntent.status === 'succeeded') {
        console.log("Payment succeeded!");
        // Webhook will grant access.
        // Now attempt to log the user in automatically.
        if (onLogin) {
            console.log("Attempting auto-login...");
            // Call the login handler passed from App.js
            await onLogin(email, password);
            // onSuccess should ideally be called *after* successful login
            // OR App.js should handle the state update sequence correctly.
            // For now, call onSuccess assuming login will update state.
             onSuccess(); // Close modal, trigger access check in App.js
        } else {
             // Should not happen if App.js passes onLogin
             console.warn("onLogin handler not provided to PaymentModal.")
             alert("Payment successful! Please log in manually.");
             onSuccess(); // Still call onSuccess to close modal etc.
        }
      } else {
        console.warn("Payment status:", result.paymentIntent.status);
        setError(`Payment status: ${result.paymentIntent.status}. Please follow any additional instructions.`);
      }

    } catch (err) {
      console.error('Payment/Registration error details:', err);
      // Display specific messages from backend if available
      setError(err.message || 'An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    // Modal Backdrop
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      {/* Modal Container */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl max-w-md w-full shadow-2xl border border-gray-200 transform transition-all duration-300 ease-in-out scale-100">
        {/* Header */}
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient">
              Lifetime Access
            </h2>
            <p className="text-gray-600">Unlock all SaaS insights for a one-time payment of <span className="font-semibold text-gray-800">$30</span>.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="payment-email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon />
              </span>
              <input
                type="email"
                id="payment-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200 ease-in-out shadow-sm placeholder-gray-400"
                required
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="payment-password">
              Create Password
            </label>
            <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon />
              </span>
              <input
                type="password"
                id="payment-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200 ease-in-out shadow-sm placeholder-gray-400"
                required
                disabled={loading}
                placeholder="Choose a secure password"
              />
            </div>
          </div>

          {/* Card Details */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Payment Details</label>
             <div className="relative border border-gray-300 rounded-lg p-3 shadow-sm bg-white">
                <span className="absolute top-3 left-3 pointer-events-none">
                    <CardIcon />
                </span>
                <div className="pl-8">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            iconColor: '#6b7280',
                            '::placeholder': {
                              color: '#9ca3af',
                            },
                          },
                          invalid: {
                            color: '#ef4444',
                            iconColor: '#ef4444'
                          },
                        },
                      }}
                    />
                </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200 shadow-sm animate-fade-in">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-60 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !stripe}
              className="px-8 py-3 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-60 font-semibold shadow-md w-full sm:w-auto"
            >
              {loading ? (
                 <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                 </span>
              ) : 'Pay $30 and Get Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal; 