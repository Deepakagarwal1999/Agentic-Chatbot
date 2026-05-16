import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authApi from '../api/auth';
import { MessageSquare, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let result;
            if (isRegister) {
                result = await authApi.register(email, password, displayName);
            } else {
                result = await authApi.login(email, password);
            }
            login(result.access_token);
            navigate('/');
        } catch (err) {
            const detail = err.data?.detail;
            if (Array.isArray(detail)) {
                const messages = detail.map((e) => {
                    const field = e.loc?.[e.loc.length - 1] || 'field';
                    return `${field}: ${e.msg}`;
                });
                setError(messages.join('. '));
            } else {
                setError(detail || err.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-2xl font-bold">Chatbot</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-tight mb-6">
                        Your intelligent<br />conversation partner
                    </h2>
                    <p className="text-lg text-white/70 mb-12 max-w-md">
                        Experience AI-powered conversations with memory, context awareness, and real-time streaming responses.
                    </p>
                    <div className="space-y-4">
                        <Feature icon={<Sparkles size={18} />} text="Long-term memory across sessions" />
                        <Feature icon={<Zap size={18} />} text="Real-time streaming responses" />
                        <Feature icon={<Shield size={18} />} text="Private and secure conversations" />
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                            <MessageSquare size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-surface-900">Chatbot</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-surface-900">
                            {isRegister ? 'Create your account' : 'Welcome back'}
                        </h1>
                        <p className="text-surface-500 mt-2">
                            {isRegister ? 'Start your AI conversation journey' : 'Sign in to continue your conversations'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-red-600 text-xs font-bold">!</span>
                            </div>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="How should we call you?"
                                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                minLength={isRegister ? 8 : undefined}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                            />
                            {isRegister && (
                                <p className="mt-2 text-xs text-surface-400">Must be at least 8 characters</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isRegister ? 'Create Account' : 'Sign In'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <span className="text-sm text-surface-500">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <button
                            className="text-sm text-primary-600 hover:text-primary-700 font-semibold ml-1"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                        >
                            {isRegister ? 'Sign in' : 'Sign up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, text }) {
    return (
        <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <span className="text-sm">{text}</span>
        </div>
    );
}
