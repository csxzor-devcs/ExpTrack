import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, CheckCircle, X } from 'lucide-react';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await signUp(email, password);
            if (error) throw error;
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const glassTheme = {
        pageBg: 'bg-[#0f172a]',
        card: 'backdrop-blur-xl bg-slate-900/40 border border-slate-700/50 shadow-2xl',
        input: 'w-full px-5 py-4 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all',
        buttonPri: 'w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300'
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${glassTheme.pageBg}`}>
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className={`w-full max-w-md p-8 relative z-10 ${glassTheme.card} rounded-3xl animate-in fade-in zoom-in duration-500`}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6">
                        <TrendingUp size={32} className="text-white" strokeWidth={3} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
                    <p className="text-slate-400">Join ExpTrack today</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${glassTheme.input} pl-12`}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${glassTheme.input} pl-12`}
                                placeholder="Create a password"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`${glassTheme.input} pl-12`}
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${glassTheme.buttonPri} flex items-center justify-center gap-2`}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Create Account <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`${glassTheme.card} max-w-sm w-full p-6 bg-slate-900 border-slate-700 text-center animate-in zoom-in-95 duration-300`}>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle size={32} className="text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
                        <p className="text-slate-400 mb-6">
                            We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox (and spam folder) to verify your account.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className={`${glassTheme.buttonPri} w-full`}
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signup;
