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

// ---- Token Management ----
// Function to get tokens from localStorage
const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const expiry = localStorage.getItem('tokenExpiry');
    const email = localStorage.getItem('userEmail');
    // Basic check if tokens exist
    if (accessToken && refreshToken && expiry && email) {
       return { accessToken, refreshToken, expiry: parseInt(expiry, 10), email };
    }
  } catch (error) {
      console.error("Error reading tokens from localStorage:", error);
  }
  return { accessToken: null, refreshToken: null, expiry: null, email: null };
};

// Function to store tokens in localStorage
const storeTokens = (accessToken, refreshToken, expiry, email) => {
  try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpiry', expiry.toString());
      localStorage.setItem('userEmail', email);
  } catch (error) {
      console.error("Error saving tokens to localStorage:", error);
  }
};

// Function to clear tokens from localStorage
const clearStoredTokens = () => {
   try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('userEmail');
   } catch (error) {
      console.error("Error clearing tokens from localStorage:", error);
   }
};

// Store tokens in memory (initialized from localStorage)
let inMemoryTokenData = {
  accessToken: null,
  refreshToken: null,
  expiry: null,
};
// ---- End Token Management ----


// Function to handle API calls with auth and token refresh
const fetchWithAuth = async (url, options = {}) => {
  // Ensure inMemoryTokenData is populated if empty, check localStorage
  if (!inMemoryTokenData.accessToken) {
      const stored = getStoredTokens();
      if (stored.accessToken && stored.expiry && stored.refreshToken) {
          inMemoryTokenData = { // Update in-memory cache
              accessToken: stored.accessToken,
              refreshToken: stored.refreshToken,
              expiry: stored.expiry,
          };
          console.log("Loaded tokens from localStorage into memory.");
      }
  }

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
          const newAccessToken = refreshData.access_token;
          const newExpiry = Date.now() + 14 * 60 * 1000; // Assume 14 min validity for safety

          // Update in-memory store AND localStorage
          inMemoryTokenData.accessToken = newAccessToken;
          inMemoryTokenData.expiry = newExpiry;
          // Retrieve email from localStorage to store alongside new tokens
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
            storeTokens(newAccessToken, refreshToken, newExpiry, storedEmail); // Store updated token
          } else {
            console.warn("User email not found in localStorage during token refresh.");
            // Consider clearing tokens if email is missing, might indicate an issue
            clearStoredTokens();
            inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
            window.location.reload(); // Force logout
            return null;
          }
          accessToken = newAccessToken; // Use the new token for the current request
          console.log("Token refreshed successfully.");
        } else {
            console.error("Failed to refresh token. Logging out.");
            // Clear tokens if refresh fails
            clearStoredTokens();
            inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
            // Force a page reload or state update to reflect logout might be needed here
            window.location.reload(); // Simple way to force state reset
            return null; // Indicate failure
        }
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearStoredTokens();
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
          clearStoredTokens();
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
  const [hasAccess, setHasAccess] = useState(false); // Initial state assumes no access
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null); // Initial state assumes logged out
  const [isInitializing, setIsInitializing] = useState(true); // Flag for initial load/auth check
  const [totalIdeasCount, setTotalIdeasCount] = useState(0); // New state for total ideas count

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Refactored Check Access ---
  // This function now primarily updates the state based on API response
  const updateAccessStatus = useCallback(async () => {
    // Only check if we think we have a token (in memory or potentially localStorage)
    if (!inMemoryTokenData.accessToken) {
      console.log("No token found, skipping access check.");
      setHasAccess(false);
      setCurrentUserEmail(null); // Ensure email is null if no token
      return;
    }

    console.log("Checking access for logged in user...");
    const response = await fetchWithAuth(`${API_URL}/api/verify-access`, { method: 'POST' });

    if (response && response.ok) {
      const data = await response.json();
      console.log("Access check response:", data);
      setHasAccess(data.hasAccess);
      // If access verified, ensure email is set from localStorage
      if (data.hasAccess) {
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
              setCurrentUserEmail(storedEmail);
          } else {
              console.error("Access verified but user email missing from localStorage!");
              // Handle this potential inconsistency, maybe logout?
              handleLogout(); // Logout if email is missing but access is true
          }
      } else {
           // If verify-access returns false, treat as logged out for consistency
           handleLogout();
      }
    } else {
      // Handle failed access check (e.g., network error, 401 handled by fetchWithAuth)
      console.error("Failed to verify access or fetchWithAuth returned null.");
      setHasAccess(false);
      setCurrentUserEmail(null); // Ensure logged out state
      // Consider clearing stored tokens if verification consistently fails
       clearStoredTokens();
       inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
    }
  }, []); // Add handleLogout to dependencies? Careful with loops.

  // --- Fetch Preview Data ---
  // Now depends on the `hasAccess` state managed by `updateAccessStatus`
  const fetchPreviewDataCallback = useCallback(async () => {
    console.log("Fetching preview data. Has Access State:", hasAccess);
    // The backend now handles serving preview/full data based on JWT
    const url = `${API_URL}/api/preview-data`;
    const response = await fetchWithAuth(url, { method: 'GET' }); // fetchWithAuth sends token if available

    if (response && response.ok) {
      const responseData = await response.json();
      console.log("Preview/Full data received:", responseData.data?.length, "items.");
      
      // Handle new response format with data and totalIdeasCount
      if (responseData.data) {
        setPreviewData(responseData.data);
      } else {
        // Fallback for backward compatibility
        setPreviewData(responseData);
      }
      
      // Set total ideas count if available
      if (responseData.totalIdeasCount !== undefined) {
        setTotalIdeasCount(responseData.totalIdeasCount);
      }
    } else if (response) {
      console.error("Failed to fetch preview/full data:", response.status, await response.text());
    } else {
      console.error("fetchWithAuth returned null, likely due to auth issue.");
    }
  }, [hasAccess]); // Depend on hasAccess state

  // --- Initialization Effect ---
  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true);
      console.log("Initializing auth state...");
      const stored = getStoredTokens();
      if (stored.accessToken && stored.expiry && stored.refreshToken && stored.email) {
          // Basic check: Is expiry time plausible?
          if (stored.expiry > Date.now() - 30 * 24 * 60 * 60 * 1000) { // Check if expiry is not older than 30 days ago
              console.log("Found stored tokens. Updating in-memory store.");
              inMemoryTokenData = { // Update in-memory cache first
                  accessToken: stored.accessToken,
                  refreshToken: stored.refreshToken,
                  expiry: stored.expiry,
              };
              // Validate tokens and update access status
              await updateAccessStatus();
          } else {
              console.log("Stored tokens seem expired or invalid. Clearing.");
              clearStoredTokens(); // Clear potentially expired tokens
              setHasAccess(false);
              setCurrentUserEmail(null);
          }
      } else {
          console.log("No valid stored tokens found.");
          setHasAccess(false);
          setCurrentUserEmail(null);
      }
      // Fetch data after auth check is complete
       await fetchPreviewDataCallback();
       setIsInitializing(false);
       console.log("Initialization complete.");
    };
    initializeAuth();
     // Run only once on mount
  }, [updateAccessStatus, fetchPreviewDataCallback]); // Include dependencies needed for init


  // --- Login Handler ---
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
        const expiry = Date.now() + 15 * 60 * 1000; // 15 min expiry
        // Update in-memory store AND localStorage
        inMemoryTokenData.accessToken = data.access_token;
        inMemoryTokenData.refreshToken = data.refresh_token;
        inMemoryTokenData.expiry = expiry;
        storeTokens(data.access_token, data.refresh_token, expiry, email);

        setCurrentUserEmail(email); // Set email immediately
        setHasAccess(true); // Assume access is true after login, verify shortly
        setShowAuthModal(false);

        // Verify access and fetch data after successful login
        await updateAccessStatus(); // Verify and update state based on backend check
        await fetchPreviewDataCallback(); // Fetch data based on new access state

      } else {
        setAuthError(data.message || 'Login failed.');
        // Clear any potentially partially stored tokens on failed login
        clearStoredTokens();
        inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
        setHasAccess(false);
        setCurrentUserEmail(null);
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError('An error occurred during login.');
      clearStoredTokens();
      inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null };
      setHasAccess(false);
      setCurrentUserEmail(null);
    }
    setAuthLoading(false);
  };

  // --- Register Handler (No changes needed for token persistence) ---
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

  // --- Forgot Password Handler (No changes needed for token persistence) ---
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

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("User logging out.");
    clearStoredTokens(); // Clear from localStorage
    inMemoryTokenData = { accessToken: null, refreshToken: null, expiry: null }; // Clear in-memory store
    setHasAccess(false);
    setCurrentUserEmail(null);
    // Fetch preview data after logout to show limited view
    fetchPreviewDataCallback(); // This will now fetch the preview version
  };

  // --- Modal Opening Handlers ---
  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setShowAuthModal(true);
  };

  // Function to handle successful payment
  const handlePaymentSuccess = () => {
    console.log("Payment successful and auto-login completed");
    setShowPaymentModal(false);
    
    // Force access status update after payment
    updateAccessStatus();
    
    // Refresh data
    fetchPreviewDataCallback();
  };

  const handleGetAccessClick = () => {
    // If already logged in but somehow don't have access (edge case?), maybe prompt differently?
    // For now, always show payment modal. If they use existing email, backend handles it.
    setShowPaymentModal(true);
  };

  // New handler to switch from AuthModal (login mode) to PaymentModal
  const handleSwitchToPayment = () => {
      setShowAuthModal(false); // Close Auth Modal
      setShowPaymentModal(true); // Open Payment Modal
  };


  // --- Render Logic ---
  // Show loading state or minimal UI during initialization
   if (isInitializing) {
       return (
           <div className="min-h-screen flex items-center justify-center">
               {/* Optional: Add a simple loading spinner */}
               Loading...
           </div>
       );
   }

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
                 {/* Conditional rendering based on currentUserEmail state */}
                 {!currentUserEmail ? (
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
                {/* Only show "Get Access" if user doesn't have access OR isn't logged in */}
                {(!currentUserEmail || !hasAccess) && (
                  <button
                    onClick={handleGetAccessClick}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium shadow-md text-base"
                  >
                    Get Access
                  </button>
                )}
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
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Generate profitable SaaS ideas and <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">vibe code</span> them into reality with AI
            </p>
            
            {/* Total ideas counter - moved to a more prominent position */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 inline-flex items-center px-4 py-2 rounded-full border border-blue-200 shadow-sm mb-6">
              <p className="text-gray-700">
                Our database contains <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">{totalIdeasCount.toLocaleString()}</span> unique SaaS ideas
                {hasAccess && (
                  <span className="inline-flex items-center ml-3 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium text-green-800">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Full Access
                  </span>
                )}
              </p>
            </div>
            
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
                   {/* Show "Coming Soon" only if user has access */}
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
                      isLoggedIn={!!currentUserEmail}
                      onGetAccess={handleGetAccessClick}
                      fetchPreviewDataCallback={fetchPreviewDataCallback}
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
              
              {/* Added center element with vibe coder text */}
              <div className="text-gray-500 text-sm italic font-light">
                by a fellow vibe coder :)
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
              onLogin={handleLogin} // Pass handleLogin for auto-login after payment
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
            onSwitchToPayment={handleSwitchToPayment} // Pass handler to switch modals
          />
        )}
    </div>
    </Router>
  );
}

export default App;
