import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from './components/Navbar';
import DataTable from './components/DataTable';
import PaymentModal from './components/PaymentModal';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  const [previewData, setPreviewData] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    fetchPreviewData();
    checkAccess();
  }, []);

  const fetchPreviewData = async () => {
    const response = await fetch('http://localhost:5000/api/preview-data');
    const data = await response.json();
    setPreviewData(data);
  };

  const checkAccess = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    const response = await fetch('http://localhost:5000/api/verify-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setHasAccess(data.hasAccess);
  };

  const handleRestore = async (email) => {
    const response = await fetch('http://localhost:5000/api/verify-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (data.hasAccess) {
      localStorage.setItem('userEmail', email);
      setHasAccess(true);
      setShowRestoreModal(false);
    }
  };

  return (
    <div className="App">
      <Navbar 
        onGetAccess={() => setShowPaymentModal(true)}
        onRestoreAccess={() => setShowRestoreModal(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">SaaS Opportunity Database</h1>
          <p className="text-xl text-gray-600">
            Discover profitable SaaS niches with validated market demand
          </p>
        </div>

        <DataTable 
          data={previewData} 
          hasAccess={hasAccess} 
          onGetAccess={() => setShowPaymentModal(true)} 
        />

        {showPaymentModal && (
          <Elements stripe={stripePromise}>
            <PaymentModal
              onClose={() => setShowPaymentModal(false)}
              onSuccess={() => {
                setHasAccess(true);
                setShowPaymentModal(false);
              }}
            />
          </Elements>
        )}

        {showRestoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Restore Access</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRestore(e.target.email.value);
              }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full p-2 border rounded mb-4"
                  required
                />
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Restore
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
