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

  return (
    <div className="App">
      <Navbar onGetAccess={() => setShowPaymentModal(true)} />
      
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
      </main>
    </div>
  );
}

export default App;
