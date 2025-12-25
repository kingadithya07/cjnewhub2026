
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, Shield, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.READER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, forgotPassword, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        if (result.error?.includes('API key')) {
          setError('Invalid API Configuration. Please check your Supabase keys.');
        } else {
          setError('Invalid email or password.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await forgotPassword(email);
    setLoading(false);
    if (success) {
      // Redirect to the combined ResetPassword page
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } else {
      setError('Failed to send reset link. Please try again.');
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
         <button onClick={() => setIsForgotPassword(false)} className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 gap-2 font-medium z-10">
            <div className="bg-white p-2 rounded-full shadow-sm"><ArrowLeft size={20} /></div>
            <span className="hidden sm:inline">Back to Login</span>
         </button>

         <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-900 p-8 text-center border-b-4 border-[#b4a070]">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 text-[#b4a070]">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Reset Password</h2>
              <p className="text-gray-300 text-sm">Enter your email to recover your account.</p>
            </div>
            
            <div className="p-8">
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email" required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none transition-all"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending Code...' : 'Send Recovery Code'}
                    {!loading && <ArrowRight size={20} className="text-[#b4a070]" />}
                  </button>
                </form>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 transition-colors gap-2 font-medium z-10">
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            <Newspaper size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Sign In to Dashboard</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                 <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-bold text-[#b4a070] hover:underline uppercase tracking-tight">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Access As (Role)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b4a070]" size={18} />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none bg-white appearance-none cursor-pointer transition-all font-medium text-gray-700"
                >
                  <option value={UserRole.READER}>Reader (Public Access)</option>
                  <option value={UserRole.EDITOR}>Editor (Content Management)</option>
                  <option value={UserRole.PUBLISHER}>Publisher (Ads & Distribution)</option>
                  <option value={UserRole.ADMIN}>Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={20} className="text-[#b4a070]" />}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              New to NewsFlow?{' '}
              <Link to="/register" className="text-[#b4a070] font-black hover:underline tracking-tight uppercase">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
