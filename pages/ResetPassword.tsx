
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle, AlertCircle, ShieldCheck, Loader2, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for the initial token exchange process
  const [verifyingLink, setVerifyingLink] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // 1. If we are already authenticated via context (e.g. came from settings), we are good.
    if (isAuthenticated) {
      setVerifyingLink(false);
      setSessionVerified(true);
      return;
    }

    // 2. Set up a listener for the Password Recovery event specifically
    // This event fires when Supabase successfully processes the token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth Event:", event);

      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionVerified(true);
        setVerifyingLink(false);
      }
    });

    // 3. Fallback Check: Sometimes the event fires before component mounts. 
    // Check if we have a session or if the URL has the token hash.
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        setSessionVerified(true);
        setVerifyingLink(false);
      }
    };

    // 4. Safety Timeout: If after 10 seconds we still haven't gotten an event
    // and don't have a session, we consider the link failed/expired.
    const timeoutId = setTimeout(() => {
      if (mounted && !sessionVerified) {
         // Final check before declaring death
         supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session && mounted) {
               setVerifyingLink(false);
               // If we failed, sessionVerified remains false
            }
         });
      }
    }, 10000); // 10 second grace period for mobile/slow connections

    checkCurrentSession();

    return () => { 
        mounted = false; 
        subscription.unsubscribe();
        clearTimeout(timeoutId);
    };
  }, [isAuthenticated, sessionVerified]); // Depend on sessionVerified to avoid re-triggering timeout logic if already verified

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    setError('');

    try {
      // Basic check to see if user is just typing their old password
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password
          });
          if (signInData.session) {
             setLoading(false);
             setError("You cannot reuse your old password. Please enter a new one.");
             return;
          }
      }

      const result = await updatePassword(password);
      if (result.success) {
        navigate('/auth-success?type=password-reset-success');
      } else {
        setError(result.error || 'Failed to update password. Your session may have timed out.');
      }
    } catch (err) {
      setError('An unexpected error occurred during password update.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingLink) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
                <Loader2 className="animate-spin text-[#b4a070] mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800">Verifying Link...</h2>
                <p className="text-gray-500 text-sm mt-2 mb-4">Establishing secure connection.</p>
                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 w-full">
                   Tip: Don't close this window while we sync your credentials.
                </div>
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
             <p className="text-gray-500 mb-6 text-sm">
                We couldn't verify your secure session. This happens if the link is old, already used, or opened in a different browser.
             </p>
             <div className="space-y-3">
                 <Link 
                    to="/login"
                    className="inline-flex items-center justify-center w-full bg-[#111827] text-white font-bold py-4 rounded-xl hover:bg-black transition-colors"
                 >
                    Request New Link
                 </Link>
                 
                 {/* Hash detection help for user */}
                 {window.location.hash.includes('access_token') && (
                     <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg text-left mt-4 border border-yellow-100">
                        <p className="font-bold flex items-center gap-1 mb-1"><Smartphone size={12}/> Troubleshooting:</p>
                        It looks like you have a token. Try refreshing the page once. If that fails, please request a new link and open it in this same browser.
                     </div>
                 )}
             </div>
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
                <CheckCircle size={16} /> Secure Session Active
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
