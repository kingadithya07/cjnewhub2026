
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Newspaper, Lock, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      // Determine redirect based on previous location or default logic
      // Ideally AuthContext returns the user object, but we'll let App handle the redirect or simple refresh
      navigate('/');
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    setResetSent(true);
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
         <button onClick={() => setIsForgotPassword(false)} className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 gap-2 font-medium z-10">
            <div className="bg-white p-2 rounded-full shadow-sm"><ArrowLeft size={20} /></div>
            <span className="hidden sm:inline">Back to Login</span>
         </button>

         <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-900 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 text-white">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-gray-300 text-sm">Enter your email to receive recovery instructions.</p>
            </div>
            
            <div className="p-8">
              {resetSent ? (
                <div className="text-center">
                   <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-sm">
                      If an account exists for <strong>{email}</strong>, we have sent a reset link.
                   </div>
                   <button onClick={() => setIsForgotPassword(false)} className="text-indigo-600 font-bold hover:underline">Return to Login</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email" required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 transition-colors gap-2 font-medium z-10">
        <div className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
           <ArrowLeft size={20} />
        </div>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-900 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 text-white">
            <Newspaper size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-indigo-200">Sign in to your NewsFlow account</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-gray-700">Password</label>
                 <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-indigo-600 hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-lg shadow-indigo-200"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
