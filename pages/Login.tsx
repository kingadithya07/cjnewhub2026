
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.READER);
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
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Connection failure. Check if Supabase project is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setResetSent(true);
      } else {
        setError(result.error || 'Could not send reset link.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
         <button onClick={() => setIsForgotPassword(false)} className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 gap-2 font-medium z-10 transition-transform active:scale-95">
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100"><ArrowLeft size={20} /></div>
            <span className="hidden sm:inline">Back to Login</span>
         </button>

         <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4 text-[#b4a070] ring-4 ring-white/5">
                <KeyRound size={36} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Recovery</h2>
              <p className="text-gray-400 text-sm tracking-widest uppercase">Password Reset</p>
            </div>
            
            <div className="p-10">
              {resetSent ? (
                <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                   <div className="bg-green-50 text-green-700 p-6 rounded-2xl mb-8 text-sm border border-green-100 flex flex-col items-center gap-3">
                      <CheckCircle2 size={32} className="text-green-500" />
                      <p className="font-medium text-center leading-relaxed">
                        A recovery link has been sent to<br/>
                        <strong className="text-green-800 break-all">{email}</strong><br/>
                        Please check your inbox (and spam folder).
                      </p>
                   </div>
                   <button onClick={() => setIsForgotPassword(false)} className="bg-[#111827] text-white w-full py-4 rounded-xl font-bold transition-all hover:bg-black">Return to Login</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
                      <p className="font-medium">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070] transition-colors" size={20} />
                      <input
                        type="email" required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all text-gray-900 font-medium"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Processing...' : 'Send Reset Link'}</span>
                    {!loading && <ArrowRight size={20} className="text-[#b4a070]" />}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    Note: It may take up to 2 minutes for the email to arrive. Check your spam folder if it doesn't appear.
                  </p>
                </form>
              )}
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

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4 text-[#b4a070] ring-4 ring-white/5">
            <Newspaper size={36} />
          </div>
          <h2 className="text-4xl font-black text-white mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-[0.3em] uppercase font-bold">Sign In</p>
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070] transition-colors" size={20} />
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all text-gray-900 font-medium"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Password</label>
                 <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black text-[#b4a070] hover:underline uppercase tracking-widest">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070] transition-colors" size={20} />
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all text-gray-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg">{loading ? 'Verifying...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={22} className="text-[#b4a070]" />}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              New Member?{' '}
              <Link to="/register" className="text-[#b4a070] font-black hover:underline tracking-widest uppercase text-xs ml-1">
                Join Today
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
