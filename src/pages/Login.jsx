import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, ArrowRight, Zap, Shield, Activity, Cloud } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, googleSignIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to sign in. Check your credentials.");
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            await googleSignIn();
            navigate("/dashboard");
        } catch (err) {
            setError("Google Sign-in failed.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-gray to-white flex flex-col lg:flex-row">
            {/* Hero Section */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <span className="text-2xl font-bold text-dark-gray">Lens<span className="text-bright-blue">Clear</span></span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-dark-gray mb-6 leading-tight">
                        LensClear — Intelligent IoT Dashboard for <span className="text-primary">Real-Time Monitoring</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 max-w-lg">
                        Manage your devices, visualize data, and control your hardware from anywhere in the world with our production-ready platform.
                    </p>

                    <div className="flex items-center gap-4 mb-12">
                        <a href="#features" className="px-6 py-3 text-gray-600 font-medium hover:text-primary transition-colors">
                            Learn More
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Zap size={24} className="text-orange-500 mb-2" />
                            <h3 className="font-bold text-gray-800">Device Control</h3>
                            <p className="text-xs text-gray-500">Instant remote execution</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Activity size={24} className="text-green-500 mb-2" />
                            <h3 className="font-bold text-gray-800">Real-Time</h3>
                            <p className="text-xs text-gray-500">Live sensor monitoring</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Shield size={24} className="text-red-500 mb-2" />
                            <h3 className="font-bold text-gray-800">Alerts</h3>
                            <p className="text-xs text-gray-500">Instant notifications</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Cloud size={24} className="text-blue-500 mb-2" />
                            <h3 className="font-bold text-gray-800">Cloud Sync</h3>
                            <p className="text-xs text-gray-500">Powered by Firebase</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form Section */}
            <div className="lg:w-1/2 bg-white p-8 lg:p-16 flex flex-col justify-center border-l border-gray-100">
                <div className="max-w-md mx-auto w-full">
                    <h2 className="text-2xl font-bold text-dark-gray mb-2">Welcome Back</h2>
                    <p className="text-gray-500 mb-8">Sign in to access your dashboard</p>

                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-field"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary hover:text-primary-dark font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
                            {loading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        type="button"
                        className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </button>

                    <p className="text-center mt-8 text-gray-600">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-primary font-bold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
