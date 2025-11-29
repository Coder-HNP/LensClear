import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            setMessage("");
            setError("");
            await resetPassword(email);
            setMessage("Check your inbox for password reset instructions.");
        } catch (err) {
            setError("Failed to reset password: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-gray px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-dark-gray">Reset Password</h2>
                    <p className="text-gray-500 mt-2">Enter your email to receive reset link</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
                {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm border border-green-100">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Email Address</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <Link to="/" className="text-gray-500 hover:text-dark-gray flex items-center justify-center gap-2 font-medium">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
