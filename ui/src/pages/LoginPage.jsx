import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authApi from '../api/auth';
import { MessageSquare, ArrowRight, Sparkles, Shield, Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
            <div className="hidden lg:flex lg:w-[45%] bg-surface-900 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/20 via-transparent to-purple-600/10"></div>
                    <div className="absolute top-20 -left-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <MessageSquare size={22} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Chatbot</span>
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
                        Your intelligent<br />
                        <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                            conversation partner
                        </span>
                    </h2>
                    <p className="text-lg text-surface-400 mb-14 max-w-md leading-relaxed">
                        Experience AI-powered conversations with memory, context awareness, and real-time streaming responses.
                    </p>

                    <div className="space-y-5">
                        <Feature icon={<Sparkles size={18} />} title="Long-term memory" desc="Remembers across sessions" />
                        <Feature icon={<Zap size={18} />} title="Real-time streaming" desc="Instant token-by-token responses" />
                        <Feature icon={<Shield size={18} />} title="Private & secure" desc="Your data stays yours" />
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white">
                <div className="w-full max-w-[400px]">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <MessageSquare size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-surface-900">Chatbot</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
                            {isRegister ? 'Create your account' : 'Welcome back'}
                        </h1>
                        <p className="text-surface-500 mt-2 text-[15px]">
                            {isRegister ? 'Start your AI conversation journey' : 'Sign in to continue your conversations'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3 animate-fade-in-up">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-red-600 text-xs font-bold">!</span>
                            </div>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div className="animate-fade-in-up">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="How should we call you?"
                                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all placeholder:text-surface-400 text-[14px]"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all placeholder:text-surface-400 text-[14px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={isRegister ? 8 : undefined}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-11 bg-surface-50 border border-surface-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all placeholder:text-surface-400 text-[14px]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {isRegister && (
                                <p className="mt-1.5 text-xs text-surface-400">Must be at least 8 characters</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:scale-[1.01] active:scale-[0.99] mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isRegister ? 'Create Account' : 'Sign In'}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <span className="text-sm text-surface-500">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <button
                            className="text-sm text-primary-600 hover:text-primary-700 font-semibold ml-1.5 hover:underline underline-offset-2"
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

function Feature({ icon, title, desc }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-surface-400">{desc}</p>
            </div>
        </div>
    );
}
