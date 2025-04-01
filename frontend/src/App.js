import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from './components/Navbar';
import DataTable from './components/DataTable';
import PaymentModal from './components/PaymentModal';
import UsageGuide from './components/UsageGuide';
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// API URL - use environment variable in production or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [previewData, setPreviewData] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    fetchPreviewData();
    checkAccess();
  }, []);

  const fetchPreviewData = async () => {
    const email = localStorage.getItem('userEmail');
    const url = email 
      ? `${API_URL}/api/preview-data?email=${encodeURIComponent(email)}`
      : `${API_URL}/api/preview-data`;
      
    const response = await fetch(url);
    const data = await response.json();
    setPreviewData(data);
  };

  const checkAccess = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    const response = await fetch(`${API_URL}/api/verify-access`, {
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
    const response = await fetch(`${API_URL}/api/verify-access`, {
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
      setRestoreError('');
      fetchPreviewData();
    } else {
      setRestoreError('This email is not registered. Please check your email or purchase access.');
    }
  };

  const handlePaymentSuccess = () => {
    setHasAccess(true);
    setShowPaymentModal(false);
    fetchPreviewData();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                SaaS Insight Engine
              </h1>
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-6 py-2 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all font-medium border border-blue-200 shadow-sm"
                >
                  Restore Access
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium shadow-md text-base"
                >
                  Get Access
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <Routes>
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/refund" element={<RefundPolicy />} />
            <Route path="/" element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-1 flex flex-col">
                  <UsageGuide />
                  {hasAccess && (
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg shadow-sm p-6 border border-blue-200 hover:shadow-md transition-shadow mt-8 flex-1">
                      <div className="flex flex-col h-full">
                        <div className="mb-4">
                          <span className="inline-block bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 text-transparent bg-clip-text font-bold px-3 py-1 rounded-full text-sm font-mono border border-blue-200 shadow-sm">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">Coming Soon</span>
                          </span>
                        </div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-3">
                          Vibe Coding Template Generator
                        </h2>
                        <p className="text-gray-600 mb-4">
                          Generate vibe-code ready templates for no-code platforms like Manus and Bubble. Each template is optimized for creating full SaaS products.
                        </p>
                        <ul className="space-y-2 mb-4 text-gray-600">
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">⚡</span>
                            Platform-specific templates
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-500 mr-2">🎨</span>
                            Pre-configured UI flows
                          </li>
                          <li className="flex items-start">
                            <span className="text-indigo-500 mr-2">🔧</span>
                            Database structure templates
                          </li>
                        </ul>
                        <div className="text-sm text-gray-500">
                          Monthly generation quota included
                        </div>
                      </div>
                    </div>
                  )}
        </div>
                <div className="lg:col-span-2 flex flex-col">
                  <div className="flex-1">
        <DataTable 
          data={previewData} 
          hasAccess={hasAccess} 
          onGetAccess={() => setShowPaymentModal(true)} 
        />
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-lg shadow-sm p-6 border border-violet-200 hover:shadow-md transition-shadow mt-8">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center ring-2 ring-white">
                            <img 
                              src="/images/profile_pic_placeholder1.png" 
                              alt="" 
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = '👤';
                              }}
                            />
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400 flex items-center justify-center ring-2 ring-white">
                            <img 
                              src="/images/profile_pic_placeholder2.png" 
                              alt="" 
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = '👤';
                              }}
                            />
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center ring-2 ring-white">
                            <img 
                              src="/images/profile_pic_placeholder3.png" 
                              alt="" 
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = '👤';
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 font-medium text-lg">+</span>
                          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 ml-1">350</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-1">
                          Entrepreneurs Building
                        </h2>
                        <p className="text-gray-600">
                          Join our growing community of SaaS founders and developers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </main>

        <footer className="border-t border-gray-200 mt-12 py-6">
          <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-600 text-sm">
                © {new Date().getFullYear()} 4houses Ventures UG. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link to="/legal/terms" className="text-gray-600 hover:text-gray-900">
                  Terms
                </Link>
                <Link to="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy
                </Link>
                <Link to="/legal/refund" className="text-gray-600 hover:text-gray-900">
                  Refund
                </Link>
                <a href="mailto:philipp.haus@icloud.com" className="text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>

        {showPaymentModal && (
          <Elements stripe={stripePromise}>
            <PaymentModal
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handlePaymentSuccess}
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
                {restoreError && (
                  <div className="text-red-600 text-sm mb-4">
                    {restoreError}
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreError('');
                    }}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium shadow-md"
                  >
                    Restore
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
    </Router>
  );
}

export default App;
