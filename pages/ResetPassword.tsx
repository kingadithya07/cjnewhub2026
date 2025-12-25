
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle, AlertCircle, ShieldCheck, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated, user } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  // Use a ref to track if we found a session to prevent state updates after unmount
  const sessionFoundRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let attemptCount = 0;
    const maxAttempts = 10; // Try for 5 seconds (500ms intervals)

    // Listener for immediate events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (mounted && !sessionFoundRef.current) {
           sessionFoundRef.current = true;
           setValidSession(true);
           setChecking(false);
        }
      }
    });

    const verifySession = async () => {
      if (sessionFoundRef.current) return;

      try {
        // Check 1: Context
        if (isAuthenticated) {
           if (mounted) {
             sessionFoundRef.current = true;
             setValidSession(true);
             setChecking(false);
           }
           return;
        }

        // Check 2: Supabase Session (LocalStorage)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           if (mounted) {
             sessionFoundRef.current = true;
             setValidSession(true);
             setChecking(false);
           }
           return;
        }

        // Check 3: Server User Check (Strongest check)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
           if (mounted) {
             sessionFoundRef.current = true;
             setValidSession(true);
             setChecking(false);
           }
           return;
        }

        // Retry Logic
        if (attemptCount < maxAttempts) {
           attemptCount++;
           setTimeout(verifySession, 500); // Poll every 500ms
        } else {
           // If all attempts fail
           if (mounted) {
             setValidSession(false);
             setChecking(false);
           }
        }
      } catch (e) {
        // Continue retrying if error (network glitch etc)
        if (attemptCount < maxAttempts) {
            attemptCount++;
            setTimeout(verifySession, 500);
         } else {
            if (mounted) {
              setChecking(false);
            }
         }
      }
    };

    verifySession();

    return () => { 
        mounted = false; 
        subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    setError('');

    try {
      // Get user email for reuse check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const targetEmail = user?.email || currentUser?.email;

      if (targetEmail) {
        // Attempt sign in to check if password is same as old one
        const { data: reuseCheckData } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password
        });
        
        // If sign in succeeds, it means they are using the OLD password
        if (reuseCheckData.user) {
            setLoading(false);
            setError("You cannot use your previous password. Please choose a different one.");
            return;
        }
      }

      const result = await updatePassword(password);
      if (result.success) {
        navigate('/auth-success?type=password-reset-success');
      } else {
        setError(result.error || 'Failed to update password. Session may have expired.');
      }
    } catch (err) {
      setError('An unexpected error occurred during password update.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-[#b4a070] mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-800">Verifying Security Token...</h2>
            <p className="text-gray-500 text-sm mt-2">Connecting to secure session.</p>
        </div>
     );
  }

  // If check completed and no valid session
  if (!validSession) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-in fade-in duration-300">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
             <p className="text-gray-500 mb-6 text-sm">
                We couldn't verify your session. This usually happens if the link was already used or expired.
             </p>
             <div className="space-y-3">
                 <Link 
                    to="/login"
                    className="inline-flex items-center justify-center w-full bg-[#111827] text-white font-bold py-4 rounded-xl hover:bg-black transition-colors"
                 >
                    Return to Login
                 </Link>
                 <button 
                    onClick={() => window.location.reload()} 
                    className="w-full text-indigo-600 font-bold text-sm hover:underline flex items-center justify-center gap-2"
                 >
                    <RefreshCw size={14} /> Try Reloading Page
                 </button>
             </div>
          </div>
        </div>
      );
  }

  // Authenticated: Show Reset Form
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
