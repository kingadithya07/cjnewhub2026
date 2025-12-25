
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Wifi, WifiOff, ExternalLink, Play, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, loginAsDemo, forgotPassword, connectionStatus, refreshDeviceStatus } = useAuth();
  const navigate = useNavigate();

  // Clear general error if status goes back online
  useEffect(() => {
    if (connectionStatus === 'online' && error.includes('reach Supabase')) {
      setError('');
    }
  }, [connectionStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        let msg = result.error || 'Invalid credentials.';
        if (msg.includes('Email not confirmed')) {
          msg = "Email not confirmed. Check your inbox for the link.";
        }
        setError(msg);
      }
    } catch (err) {
      setError('Connection failure. Please check if your project is active.');
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
        setError(result.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('Connection error reaching the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    loginAsDemo(UserRole.ADMIN);
    navigate('/');
  };

  const ConnectionBadge = () => (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-50 transition-all ${connectionStatus === 'online' ? 'bg-green-100 text-green-700 border border-green-200' : connectionStatus === 'offline' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-400'}`}>
      {connectionStatus === 'online' ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
      {connectionStatus === 'online' ? 'System Online' : connectionStatus === 'offline' ? 'System Offline' : 'Connecting...'}
    </div>
  );

  const Troubleshooter = () => (
    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-8 text-sm animate-in fade-in slide-in-from-top-4 shadow-sm">
       <div className="flex items-center gap-3 text-red-700 mb-3">
          <WifiOff size={24} />
          <h4 className="font-black uppercase tracking-widest text-xs">Connectivity Issue Detected</h4>
       </div>
       <p className="text-red-600 mb-4 leading-relaxed font-medium">
          The app cannot reach your database. This usually happens because the Supabase project is <strong>PAUSED</strong>.
       </p>
       <div className="flex flex-col gap-3">
          <a 
            href="https://supabase.com/dashboard/project/wpfzfozfxtwdaejramfz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all shadow-md group"
          >
             Open Supabase Dashboard <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          <div className="flex items-center gap-2 py-1">
             <div className="h-px bg-red-200 flex-1"></div>
             <span className="text-[10px] font-black text-red-300 uppercase">OR</span>
             <div className="h-px bg-red-200 flex-1"></div>
          </div>
          <button 
             onClick={handleDemoBypass}
             className="flex items-center justify-center gap-2 bg-white border-2 border-indigo-600 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
          >
             <Play size={16} fill="currentColor" /> Enter Demo Mode (Mock Data)
          </button>
          <button 
             onClick={() => { setError(''); refreshDeviceStatus(); }}
             className="text-gray-500 font-bold py-2 hover:text-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
             <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Retry Connection
          </button>
       </div>
    </div>
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
         <ConnectionBadge />
         <button onClick={() => setIsForgotPassword(false)} className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 gap-2 font-medium z-10">
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100"><ArrowLeft size={20} /></div>
            <span className="hidden sm:inline">Back to Login</span>
         </button>
         <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4 text-[#b4a070]">
                <KeyRound size={36} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Recovery</h2>
              <p className="text-gray-400 text-sm tracking-widest uppercase">Password Reset</p>
            </div>
            <div className="p-10">
              {resetSent ? (
                <div className="text-center">
                   <div className="bg-green-50 text-green-700 p-6 rounded-2xl mb-8 text-sm border border-green-100 flex flex-col items-center gap-3">
                      <CheckCircle2 size={32} className="text-green-500" />
                      <p className="font-medium text-center">Recovery link sent to <strong>{email}</strong>. Check your inbox.</p>
                   </div>
                   <button onClick={() => setIsForgotPassword(false)} className="bg-[#111827] text-white w-full py-4 rounded-xl font-bold">Return to Login</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {connectionStatus === 'offline' && <Troubleshooter />}
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Email Address</label>
                    <input
                      type="email" required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-[#b4a070] outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <ConnectionBadge />
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            <Newspaper size={36} />
          </div>
          <h2 className="text-4xl font-black text-white mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-[0.3em] uppercase font-bold">Sign In</p>
        </div>

        <div className="p-10">
          {(connectionStatus === 'offline' || error.includes('fetch')) ? <Troubleshooter /> : (
             <form onSubmit={handleSubmit} className="space-y-6">
               {error && (
                 <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
                   <p className="font-medium">{error}</p>
                 </div>
               )}
               
               <div>
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Email</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070]" size={20} />
                   <input
                     type="email" required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all"
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
                   <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070]" size={20} />
                   <input
                     type="password" required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all"
                     placeholder="••••••••"
                   />
                 </div>
               </div>

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
               >
                 <span className="text-lg">{loading ? 'Verifying...' : 'Sign In'}</span>
                 {!loading && <ArrowRight size={22} className="text-[#b4a070]" />}
               </button>
             </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              New Member?{' '}
              <Link to="/register" className="text-[#b4a070] font-black hover:underline uppercase text-xs ml-1">
                Join Today
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
