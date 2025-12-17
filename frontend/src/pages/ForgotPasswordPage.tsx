import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle, Code2 } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // In development, show the reset link
                if (data.resetLink) {
                    setResetLink(data.resetLink);
                }
            } else {
                setError(data.error || 'Failed to send reset link');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    {!success ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center mx-auto mb-4">
                                    <Mail size={32} className="text-[var(--accent-blue)]" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Forgot Password?</h1>
                                <p className="text-[var(--text-muted)]">
                                    No worries! Enter your email and we'll send you a reset link.
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
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="input pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="btn btn-primary w-full"
                                >
                                    {loading ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Check Your Email</h2>
                            <p className="text-[var(--text-muted)] mb-4">
                                We've sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>
                            </p>

                            {/* Development: Show reset link directly */}
                            {resetLink && (
                                <div className="mb-4 p-4 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-lg">
                                    <p className="text-xs text-[var(--accent-blue)] mb-2">Development Mode - Reset Link:</p>
                                    <a
                                        href={resetLink}
                                        className="text-sm text-[var(--accent-blue)] underline break-all"
                                    >
                                        Click here to reset password
                                    </a>
                                </div>
                            )}

                            <p className="text-sm text-[var(--text-muted)]">
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => { setSuccess(false); setResetLink(''); }}
                                    className="text-[var(--accent-blue)] hover:underline"
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
