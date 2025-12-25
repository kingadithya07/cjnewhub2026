
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, Lock, Mail, ArrowRight, ArrowLeft, Shield, AlertCircle, X, KeyRound, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.READER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login, forgotPassword } = useAuth();
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
    if (!forgotEmail) return;
    
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(false);

    try {
      const result = await forgotPassword(forgotEmail);
      if (result.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(result.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setForgotError('An unexpected error occurred.');
    } finally {
      setForgotLoading(false);
    }
  };

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
                 <button 
                    type="button" 
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); }}
                    className="text-xs font-bold text-[#b4a070] hover:text-indigo-800 transition-colors"
                 >
                    Forgot Password?
                 </button>
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

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <KeyRound className="text-[#b4a070]" size={20} /> Reset Password
                 </h3>
                 <button onClick={() => setShowForgotModal(false)} className="text-gray-400 hover:text-gray-800 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                 {!forgotSuccess ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <p className="text-sm text-gray-500">
                           Enter your email address and we'll send you a link to reset your password.
                        </p>
                        
                        {forgotError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                             <AlertCircle size={16} /> {forgotError}
                          </div>
                        )}

                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                           <input 
                              type="email" required
                              value={forgotEmail}
                              onChange={e => setForgotEmail(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none"
                              placeholder="name@example.com"
                              autoFocus
                           />
                        </div>
                        
                        <button 
                           type="submit" 
                           disabled={forgotLoading}
                           className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                           {!forgotLoading && <ArrowRight size={16} />}
                        </button>
                    </form>
                 ) : (
                    <div className="text-center py-4">
                       <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                          <CheckCircle size={24} />
                       </div>
                       <h4 className="text-lg font-bold text-gray-900 mb-2">Check Your Email</h4>
                       <p className="text-sm text-gray-500 mb-6">
                          We've sent a password reset link to <strong>{forgotEmail}</strong>.
                       </p>
                       <button onClick={() => setShowForgotModal(false)} className="text-indigo-600 font-bold hover:underline text-sm">
                          Return to Login
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
