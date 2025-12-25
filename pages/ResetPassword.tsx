
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle, AlertCircle, ShieldCheck, Loader2, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for the token exchange process
  const [verifyingLink, setVerifyingLink] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    const checkHashPresence = () => {
       const hash = window.location.hash;
       return hash && (hash.includes('type=recovery') || hash.includes('access_token'));
    };

    // This function runs an aggressive check to find the session "instantly"
    // avoiding the wait for standard events if they are slow.
    const aggressiveVerify = () => {
      let attempts = 0;
      // Check every 100ms (10 times per second) for a "no-wait" experience
      pollInterval = setInterval(async () => {
        if (!mounted) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          clearInterval(pollInterval);
          setSessionVerified(true);
          setVerifyingLink(false);
        } else {
          attempts++;
          // Extended timeout: 
          // If the URL has a hash token, we wait longer (10 seconds / 100 attempts)
          // If no hash, we give up sooner (3 seconds / 30 attempts)
          const maxAttempts = checkHashPresence() ? 100 : 30;
          
          if (attempts > maxAttempts) {
            clearInterval(pollInterval);
            if (mounted) {
               // Only fail if we haven't verified yet
               setVerifyingLink((current) => {
                 if (current) return false;
                 return current;
               });
            }
          }
        }
      }, 100);
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mounted) {
        setSessionVerified(true);
        setVerifyingLink(false);
      } else {
        // Start polling immediately if not found
        aggressiveVerify();
      }
    });

    // 2. Standard Event Listener (Backup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (mounted) {
          clearInterval(pollInterval);
          setSessionVerified(true);
          setVerifyingLink(false);
        }
      }
    });

    return () => { 
        mounted = false; 
        subscription.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
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
        setError(result.error || 'Failed to update password. Session may have expired.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRetry = () => {
    setVerifyingLink(true);
    setSessionVerified(false);
    // Reloading forces Supabase to re-parse the URL hash
    window.location.reload();
  };

  if (verifyingLink) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                <Loader2 className="animate-spin text-[#b4a070] mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800">Securing Connection...</h2>
                <p className="text-gray-500 text-sm mt-2">Syncing authorities...</p>
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
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
             <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                We couldn't verify the security token. This happens if the link was already used or opened in a different browser.
             </p>
             
             <button 
                onClick={handleManualRetry}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors mb-3 flex items-center justify-center gap-2"
             >
                <RefreshCw size={16} /> Force Retry
             </button>

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
                <CheckCircle size={16} /> Authorities Verified
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
          </form>
        </div>
      </div>
    </div>
  );
};
