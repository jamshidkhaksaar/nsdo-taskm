import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserService } from '../../services/user'; // Adjust path as needed
import { AxiosError } from 'axios';

const ResetPasswordForm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing password reset token. Please request a new link.');
            // Optionally redirect to request page or login after a delay
            // setTimeout(() => navigate('/forgot-password'), 5000);
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!token) {
            setError('Missing token. Cannot reset password.');
            return;
        }
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await UserService.confirmPasswordReset(token, password);
            setMessage(response.message || 'Your password has been successfully reset. You can now log in with your new password.');
            setPassword('');
            setConfirmPassword('');
            setTimeout(() => navigate('/login'), 3000); // Redirect to login after success
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
            console.error('Password reset confirmation failed:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Reset Your Password
                    </h2>
                </div>
                {!token && error && (
                     <div className="p-3 bg-red-100 dark:bg-red-700 border-l-4 border-red-500 dark:border-red-300">
                        <p className="text-sm text-red-700 dark:text-red-100">{error}</p>
                        <p className="text-sm text-red-700 dark:text-red-100 mt-2">
                            Please <a href='/forgot-password' className='font-medium underline'>request a new password reset link</a>.
                        </p>
                    </div>
                )}
                {token && (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {message && (
                            <div className="p-3 bg-green-100 dark:bg-green-700 border-l-4 border-green-500 dark:border-green-300">
                                <p className="text-sm text-green-700 dark:text-green-100">{message}</p>
                            </div>
                        )}
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-700 border-l-4 border-red-500 dark:border-red-300">
                                <p className="text-sm text-red-700 dark:text-red-100">{error}</p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition duration-150 ease-in-out"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </form>
                )}
                 <div className="text-sm text-center mt-4">
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Back to Sign In
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordForm; 