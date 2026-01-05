import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';

const LoginSignup = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate login/signup delay for effect
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            btn.innerHTML = '<span class="animate-pulse">Processing...</span>';
        }
        setTimeout(() => {
            onLogin();
        }, 800);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] flex items-center justify-center font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-blob mix-blend-screen opacity-70"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-screen opacity-70"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-screen opacity-70"></div>

            {/* Glass Container */}
            <div
                className={`
          relative w-full max-w-md p-8 m-4 
          bg-white/5 backdrop-blur-2xl border border-white/10 
          rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
          transition-all duration-1000 ease-out transform
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
        `}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {isLogin ? 'Enter your credentials to access your account' : 'Start your journey with us today'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Field (Signup only) */}
                    <div className={`transition-all duration-500 overflow-hidden ${isLogin ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all duration-300"
                                required={!isLogin}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all duration-300"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all duration-300"
                            required
                        />
                    </div>

                    {/* Forgot Password Link */}
                    {isLogin && (
                        <div className="flex justify-end">
                            <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors duration-300">
                                Forgot password?
                            </a>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="group w-full relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-[0.98] flex items-center justify-center overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0f172a]/0 backdrop-blur-xl px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all duration-300 group">
                        <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm">Github</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all duration-300 group">
                        <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm">Google</span>
                    </button>
                </div>

                {/* Toggle */}
                <p className="mt-8 text-center text-sm text-slate-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 hover:underline"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>

            {/* Decorative Blur Overlay for smoothness */}
            <div className="fixed inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PHZlRmVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIiBvcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] opacity-20"></div>
        </div>
    );
};

export default LoginSignup;
