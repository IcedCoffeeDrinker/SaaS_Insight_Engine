import React, { useState } from 'react';

// SVG Icons (copied from PaymentModal)
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

function AuthModal({ mode, onClose, onLogin, onRegister, onForgotPassword, setMode, error, loading, onSwitchToPayment }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;

        if (mode === 'login') {
            onLogin(email, password);
        } else if (mode === 'register') {
            if (password !== confirmPassword) {
                alert("Passwords do not match!"); // Basic validation
                return;
            }
            onRegister(email, password);
        } else if (mode === 'forgotPassword') {
            onForgotPassword(email);
        }
    };

    const getTitle = () => {
        if (mode === 'login') return 'Restore Access'; // Changed Login to Restore Access for consistency
        if (mode === 'register') return 'Create Account';
        if (mode === 'forgotPassword') return 'Reset Password';
        return '';
    };

    const getButtonText = () => {
        if (mode === 'login') return 'Login';
        if (mode === 'register') return 'Register';
        if (mode === 'forgotPassword') return 'Send Reset Link';
        return '';
    };

    const handleSwitchToRegisterClick = () => {
        if (onSwitchToPayment) {
            onClose(); // Close current modal
            onSwitchToPayment(); // Trigger opening the payment modal
        } else {
            // Fallback or default behavior if prop not provided (though it should be)
            setMode('register'); 
        }
    };

    return (
        // Updated Modal Backdrop
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
            {/* Updated Modal Container */}
            <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl max-w-md w-full shadow-2xl border border-gray-200 transform transition-all duration-300 ease-in-out scale-100">
                {/* Updated Header */}
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient">
                        {getTitle()}
                    </h2>
                    {mode === 'login' && <p className="text-gray-600">Login to restore your access.</p>}
                    {mode === 'register' && <p className="text-gray-600">Create an account to get started.</p>}
                    {mode === 'forgotPassword' && <p className="text-gray-600">Enter your email to receive a password reset link.</p>}
                 </div>

                {/* Updated Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="auth-email">
                            Email Address
                        </label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MailIcon />
                            </span>
                            <input
                                type="email"
                                id="auth-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200 ease-in-out shadow-sm placeholder-gray-400"
                                required
                                disabled={loading}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {/* Password Input (Not shown in forgotPassword mode) */}
                    {mode !== 'forgotPassword' && (
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="auth-password">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon />
                                </span>
                                <input
                                    type="password"
                                    id="auth-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200 ease-in-out shadow-sm placeholder-gray-400"
                                    required={mode !== 'forgotPassword'}
                                    disabled={loading}
                                    placeholder={mode === 'register' ? "Choose a secure password" : "Enter your password"}
                                />
                             </div>
                         </div>
                    )}

                    {/* Confirm Password Input (Only for registration) */}
                    {mode === 'register' && (
                         <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon />
                                </span>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all duration-200 ease-in-out shadow-sm placeholder-gray-400"
                                    required={mode === 'register'}
                                    disabled={loading}
                                    placeholder="Re-enter your password"
                                />
                            </div>
                         </div>
                    )}

                    {/* Updated Error Message */}
                    {error && (
                        <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200 shadow-sm animate-fade-in">{error}</div>
                    )}

                    {/* Updated Action Button */}
                     <div className="pt-2">
                         <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-3 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-60 font-semibold shadow-md flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                 </span>
                            ) : getButtonText()}
                        </button>
                    </div>

                     {/* Forgot Password Link (Only in Login mode) */}
                     {mode === 'login' && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setMode('forgotPassword')}
                                className="text-sm text-blue-600 hover:underline font-medium"
                                disabled={loading}
                             >
                                Forgot Password?
                             </button>
                        </div>
                     )}
                </form>

                 {/* Mode Switch Links */}
                 <div className="mt-6 text-center border-t border-gray-200 pt-6">
                     {mode === 'login' ? (
                         <p className="text-sm text-gray-600">
                            Need an account?{' '}
                            <button onClick={handleSwitchToRegisterClick} className="text-blue-600 hover:underline font-medium" disabled={loading}>
                                Register Now
                            </button>
                         </p>
                     ) : mode === 'register' ? (
                          <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button onClick={() => setMode('login')} className="text-blue-600 hover:underline font-medium" disabled={loading}>
                                Login Here
                            </button>
                         </p>
                     ) : ( // forgotPassword mode
                         <p className="text-sm text-gray-600">
                            Remembered your password?{' '}
                            <button onClick={() => setMode('login')} className="text-blue-600 hover:underline font-medium" disabled={loading}>
                                Back to Login
                            </button>
                         </p>
                     )}
                 </div>

                {/* Close Button (less prominent) */}
                 <div className="absolute top-4 right-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthModal; 