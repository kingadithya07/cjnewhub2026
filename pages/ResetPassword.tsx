
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle, AlertCircle, ShieldCheck, Loader2, ArrowLeft, Smartphone } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for the initial token exchange process
  const [verifyingLink, setVerifyingLink] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeReset = async () => {
      // 1. Check if we already have a valid session (e.g., coming from email link)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        if (mounted) {
          setSessionVerified(true);
          setVerifyingLink(false);
        }
        return;
      }

      // 2. If no session, check if we have the tokens in the URL to exchange
      // Supabase handles the exchange automatically, we just need to wait for the event.
      const hash = window.location.hash;
      const hasToken = hash.includes('access_token') || hash.includes('type=recovery');

      if (!hasToken) {
        // No session and no token in URL -> Invalid Link immediately
        if (mounted) {
          setVerifyingLink(false);
          setSessionVerified(false);
        }
      }
      // If hasToken is true, we stay in verifiedLink=true and wait for onAuthStateChange
    };

    // Listen for the magic link handshake
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (mounted) {
          setSessionVerified(true);
          setVerifyingLink(false);
        }
      }
    });

    initializeReset();

    return () => { 
        mounted = false; 
        subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    setError('');

    try {
      const result = await updatePassword(password);
      if (result.success) {
        navigate('/auth-success?type=password-reset-success');
      } else {
        setError(result.error || 'Failed to update password. Please try requesting a new link.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingLink) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                <Loader2 className="animate-spin text-[#b4a070] mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800">Securing Connection...</h2>
                <p className="text-gray-500 text-sm mt-2">Validating your recovery token.</p>
            </div>
        </div>
     );
  }

  // If validation finished but we failed to get a session
  if (!sessionVerified) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-in fade-in duration-300">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h2>
             <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                We couldn't verify your secure session. This link may have already been used or expired.
             </p>
             
             <div className="bg-gray-50 p-4 rounded-xl text-left text-xs text-gray-600 mb-6 border border-gray-100">
                <p className="font-bold mb-1 flex items-center gap-1"><Smartphone size={12}/> troubleshooting:</p>
                <ul className="list-disc pl-4 space-y-1">
                   <li>Open the link in the <strong>same browser</strong> where you requested it.</li>
                   <li>Check if you are already logged in elsewhere.</li>
                   <li>Request a fresh link below.</li>
                </ul>
             </div>

             <Link 
                to="/login"
                className="inline-flex items-center justify-center w-full bg-[#111827] text-white font-bold py-4 rounded-xl hover:bg-black transition-colors shadow-lg"
             >
                Return to Login
             </Link>
          </div>
        </div>
      );
  }

  // Authenticated & Session Verified: Show Reset Form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
           <div className="flex justify-center mb-6">
              <div className="bg-[#b4a070] text-black p-3 rounded-full shadow-lg">
                <ShieldCheck size={28} />
              </div>
           </div>
           <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             Security Update
           </h2>
           <p className="text-gray-400 text-sm tracking-widest uppercase font-bold">
             Create New Password
           </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="mb-8 text-center">
             <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm font-bold border border-green-100 inline-flex items-center gap-2">
                <CheckCircle size={16} /> Identity Verified
             </p>
             <p className="text-gray-500 text-xs mt-3">Please set your new password below.</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070] transition-colors" size={20} />
                <input
                  type="password" required minLength={6} autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all text-gray-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#b4a070] transition-colors" size={20} />
                <input
                  type="password" required minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:ring-4 focus:ring-[#b4a070]/10 focus:border-[#b4a070] outline-none transition-all text-gray-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !password || password !== confirmPassword}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg">{loading ? 'Updating...' : 'Set New Password'}</span>
                {!loading && <CheckCircle size={22} className="text-[#b4a070]" />}
              </button>
            </div>
            
            <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                    <ArrowLeft size={14} /> Back to Sign In
                </Link>
            </div>
          </form>
        </div>

        <div className="p-6 bg-gray-50 text-center">
            <h1 className="text-xl font-black tracking-tight text-gray-400" style={{ fontFamily: '"Playfair Display", serif' }}>
                CJ<span className="text-[#b4a070]/50">NEWS</span>HUB
            </h1>
        </div>
      </div>
    </div>
  );
};
