import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Github, Sparkles } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || (!isLogin && !name)) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isLogin ? { email, password } : { email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            login(data.token, data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: '🔍', text: 'AI-powered code analysis' },
        { icon: '🛡️', text: 'Security vulnerability detection' },
        { icon: '⚡', text: 'Performance optimization tips' },
        { icon: '📊', text: 'Detailed quality metrics' },
    ];

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Branding */}
                <div className="hidden md:block">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] p-3 rounded-xl">
                            <Code2 size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">CodeReview.ai</h1>
                            <p className="text-sm text-[var(--text-muted)]">Intelligent Code Analysis</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                        Write better code,<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)]">
                            faster than ever.
                        </span>
                    </h2>

                    <p className="text-[var(--text-secondary)] mb-8">
                        Get instant feedback on your code with AI-powered analysis. Catch bugs, security issues, and improve code quality before they become problems.
                    </p>

                    <div className="space-y-4">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                <span className="text-xl">{feature.icon}</span>
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
                        <div className="flex items-center gap-2 text-[var(--accent-blue)] mb-2">
                            <Sparkles size={16} />
                            <span className="text-sm font-medium">Powered by Google Gemini AI</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Advanced AI understands context, patterns, and best practices to give you actionable insights.
                        </p>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="card p-8">
                    <div className="md:hidden flex items-center justify-center gap-3 mb-6">
                        <div className="bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] p-2 rounded-lg">
                            <Code2 size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-[var(--text-primary)]">CodeReview.ai</span>
                    </div>

                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        {isLogin ? 'Sign in to continue to your dashboard' : 'Get started with free code reviews'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg flex items-center gap-2 text-[var(--accent-red)] text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-[var(--accent-blue)] hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Processing...</>
                            ) : (
                                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 border-t border-[var(--border-primary)]"></div>
                        <span className="text-sm text-[var(--text-muted)]">or</span>
                        <div className="flex-1 border-t border-[var(--border-primary)]"></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {/* GitHub OAuth */ }}
                        className="btn btn-secondary w-full py-3"
                    >
                        <Github size={18} /> Continue with GitHub
                    </button>

                    <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-[var(--accent-blue)] hover:underline font-medium"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
