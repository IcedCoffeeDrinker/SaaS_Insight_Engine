import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) { // Basic password length validation
             setError("Password must be at least 6 characters long.");
             return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message + " Redirecting to login...");
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/'); // Navigate to home, which might trigger AuthModal if not logged in
                     // Consider opening login modal directly if possible/needed
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error("Password reset error:", err);
            setError('An error occurred. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-md">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Reset Your Password</h1>
                {!token ? (
                    <p className="text-red-600 text-center">Invalid password reset link. Please request a new one.</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
                        {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage; 