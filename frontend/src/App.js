import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from './components/Navbar';
import DataTable from './components/DataTable';
import PaymentModal from './components/PaymentModal';
import UsageGuide from './components/UsageGuide';
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';
import AuthModal from './components/AuthModal';
import ResetPasswordPage from './pages/ResetPasswordPage';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// API URL - use environment variable in production or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Store tokens in memory (more secure than localStorage for JWTs)
let inMemoryTokenData = {
  accessToken: null,
  refreshToken: null,
  expiry: null,
};

// Function to handle API calls with auth and token refresh
const fetchWithAuth = async (url, options = {}) => {
  let { accessToken, refreshToken, expiry } = inMemoryTokenData;

  // Check if token is expired or close to expiring (e.g., within 1 minute)
  if (accessToken && expiry && Date.now() >= expiry - 60 * 1000) {
    console.log("Access token expired or expiring soon, attempting refresh...");
    try {
      const refreshResponse = await fetch(`${API_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`, // Send refresh token
        },
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        // Update in-memory store
        inMemoryTokenData.accessToken = accessToken;
        inMemoryTokenData.expiry = Date.now() + 14 * 60 * 1000; // Assume 14 min validity for safety
        console.log("Token refreshed successfully.");
      } else {
        console.error("Failed to refresh token. Logging out.");
        // Clear tokens if refresh fails
        inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
         // Force a page reload or state update to reflect logout might be needed here
         window.location.reload(); // Simple way to force state reset
         return null; // Indicate failure
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
      window.location.reload();
      return null; // Indicate failure
    }
  }

  // Add Authorization header if access token exists
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json', // Ensure content type is set
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
      const response = await fetch(url, { ...options, headers });
      // Handle 401 Unauthorized specifically - could trigger logout
      if (response.status === 401 && url !== `${API_URL}/api/refresh`) { // Avoid logout loop on refresh fail
          console.error("Received 401 Unauthorized. Logging out.");
          inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
          window.location.reload(); // Force logout state
          return null; // Or throw an error
      }
      return response;
  } catch (error) {
      console.error("API call failed:", error);
      // Potentially handle network errors differently
      throw error; // Re-throw error for caller to handle
  }
};

function App() {
  const [previewData, setPreviewData] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchPreviewDataCallback = useCallback(async () => {
    console.log("Fetching preview data. Logged in:", !!inMemoryTokenData.accessToken);
    const url = `${API_URL}/api/preview-data`;
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (response && response.ok) {
      const data = await response.json();
      console.log("Preview data received:", data.length, "items. Has Access:", hasAccess);
      setPreviewData(data);
    } else if (response) {
      console.error("Failed to fetch preview data:", response.status, await response.text());
    } else {
      console.error("fetchWithAuth returned null, likely due to auth issue.");
    }
  }, [hasAccess]);

  const checkAccessCallback = useCallback(async () => {
    if (!!!inMemoryTokenData.accessToken) {
      console.log("Not logged in, skipping access check.");
      setHasAccess(false);
      return;
    }

    console.log("Checking access for logged in user...");
    const response = await fetchWithAuth(`${API_URL}/api/verify-access`, { method: 'POST' });

    if (response && response.ok) {
      const data = await response.json();
      console.log("Access check response:", data);
      setHasAccess(data.hasAccess);
    } else if (response) {
      console.error("Failed to verify access:", response.status, await response.text());
      setHasAccess(false);
    } else {
      console.error("fetchWithAuth returned null during access check.");
      setHasAccess(false);
    }
  }, []);

  useEffect(() => {
    checkAccessCallback().then(() => {
      fetchPreviewDataCallback();
    });
  }, [checkAccessCallback, fetchPreviewDataCallback]);

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        inMemoryTokenData.accessToken = data.access_token;
        inMemoryTokenData.refreshToken = data.refresh_token;
        inMemoryTokenData.expiry = Date.now() + 15 * 60 * 1000;

        setCurrentUserEmail(email);
        setHasAccess(true);
        setShowAuthModal(false);
        await checkAccessCallback();
        await fetchPreviewDataCallback();
      } else {
        setAuthError(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError('An error occurred during login.');
    }
    setAuthLoading(false);
  };

  const handleRegister = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthMode('login');
        setAuthError('');
        alert("Registration successful! Please log in to continue.");
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError('An error occurred during registration.');
    }
    setAuthLoading(false);
  };

  const handleForgotPassword = async (email) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setAuthMode('login');
      } else {
        setAuthError(data.message || 'Password reset request failed.');
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setAuthError('An error occurred requesting password reset.');
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
    setHasAccess(false);
    setCurrentUserEmail(null);
    fetchPreviewDataCallback();
    console.log("User logged out.");
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setShowAuthModal(true);
  };

  const handlePaymentSuccess = async () => {
    console.log("Payment & Auto-Login sequence completed for user:", currentUserEmail);
    setShowPaymentModal(false);
    await checkAccessCallback();
    await fetchPreviewDataCallback();
  };

  const handleGetAccessClick = () => {
    setShowPaymentModal(true);
  };

  // New handler to switch from AuthModal (login mode) to PaymentModal
  const handleSwitchToPayment = () => {
      setShowAuthModal(false); // Close Auth Modal
      setShowPaymentModal(true); // Open Payment Modal
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                SaaS Insight Engine
              </Link>
              <div className="flex items-center gap-8">
                {!!!inMemoryTokenData.accessToken ? (
                  <button
                    onClick={() => openAuthModal('login')}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-6 py-2 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all font-medium border border-blue-200 shadow-sm"
                  >
                    Restore Access
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-base font-medium text-gray-700">
                        Welcome, <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">{currentUserEmail}</span>!
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-50 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                    >
                      Logout
                    </button>
                  </div>
                )}
                <button
                  onClick={handleGetAccessClick}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium shadow-md text-base"
                >
                  Get Access
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <div className="inline-block">
              <span className="inline-block bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 text-transparent bg-clip-text font-bold px-3 py-1 rounded-full text-sm font-mono mb-4 border border-blue-200 shadow-sm">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">#VibeCoding #AIPowered #SaaS</span>
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient">
              Bulk SaaS Idea Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              Generate profitable SaaS ideas and <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">vibe code</span> them into reality with AI
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-8">
              <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-green-500 mr-2">✓</span>
                Real Google Analytics Data
              </span>
              <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-green-500 mr-2">✓</span>
                Live Competition Metrics
              </span>
              <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-green-500 mr-2">✓</span>
                Fresh Ideas from Reddit
              </span>
            </div>
          </div>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                      isLoggedIn={!!inMemoryTokenData.accessToken}
                      onGetAccess={handleGetAccessClick}
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
                <Link to="/legal/terms" className="text-gray-600 hover:text-gray-900" onClick={scrollToTop}>
                  Terms
                </Link>
                <Link to="/legal/privacy" className="text-gray-600 hover:text-gray-900" onClick={scrollToTop}>
                  Privacy
                </Link>
                <Link to="/legal/refund" className="text-gray-600 hover:text-gray-900" onClick={scrollToTop}>
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
              onLogin={handleLogin}
            />
          </Elements>
        )}

        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
            setMode={setAuthMode}
            error={authError}
            loading={authLoading}
            onSwitchToPayment={handleSwitchToPayment}
          />
        )}
    </div>
    </Router>
  );
}

export default App;
