import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Code2, KeyRound } from 'lucide-react';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            setVerifying(false);
            setError('No reset token provided');
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/auth/verify-reset-token/${token}`);
            const data = await response.json();

            if (response.ok && data.valid) {
                setTokenValid(true);
            } else {
                setError(data.error || 'Invalid or expired reset token');
            }
        } catch (err) {
            setError('Failed to verify reset token');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
        let strength = 0;
        if (pwd.length >= 6) strength++;
        if (pwd.length >= 10) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;

        if (strength <= 1) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[var(--text-muted)]">Verifying reset token...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
                            <Code2 size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold text-[var(--text-primary)]">CodeReview.ai</span>
                    </div>
                </div>

                <div className="card p-8">
                    {!tokenValid && !success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-[var(--accent-red)]" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Invalid Reset Link</h2>
                            <p className="text-[var(--text-muted)] mb-4">
                                {error || 'This password reset link is invalid or has expired.'}
                            </p>
                            <Link to="/forgot-password" className="btn btn-primary">
                                Request New Link
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Password Reset!</h2>
                            <p className="text-[var(--text-muted)] mb-4">
                                Your password has been successfully reset. Redirecting to login...
                            </p>
                            <Link to="/login" className="btn btn-primary">
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center mx-auto mb-4">
                                    <KeyRound size={32} className="text-[var(--accent-blue)]" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Reset Password</h1>
                                <p className="text-[var(--text-muted)]">
                                    Enter your new password below.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)] text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pl-10 pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {/* Password strength indicator */}
                                    {password && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded ${i <= passwordStrength.strength ? passwordStrength.color : 'bg-[var(--bg-tertiary)]'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Password strength: <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.label}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pl-10"
                                            required
                                        />
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-[var(--accent-red)] mt-1">Passwords do not match</p>
                                    )}
                                    {confirmPassword && password === confirmPassword && (
                                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                            <CheckCircle size={12} /> Passwords match
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                                    className="btn btn-primary w-full"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-[var(--accent-blue)] hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
