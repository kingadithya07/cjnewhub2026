
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP, updatePassword, isAuthenticated, user } = useAuth();

  // Extract email/code from URL parameters
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || searchParams.get('token');
  
  // Check for hash parameters (Supabase Implicit Flow often puts tokens in hash)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, '').split('?')[1] || window.location.hash.slice(1));
  const typeParam = searchParams.get('type') || hashParams.get('type');
  const accessTokenParam = hashParams.get('access_token');

  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); // New loading state for initial check
  const [error, setError] = useState('');

  // 1. CRITICAL: Watch for Authentication State
  // If the user is authenticated (via Magic Link or Session Recovery), IMMEDIATELY go to Step 2.
  useEffect(() => {
    if (isAuthenticated) {
      setStep(2);
      setCheckingSession(false);
    }
  }, [isAuthenticated]);

  // 2. Check for Recovery Event or Hash Token
  useEffect(() => {
    let mounted = true;

    const checkRecovery = async () => {
      // If we have an access token in the hash but aren't authenticated yet, Supabase is likely processing it.
      // We keep 'checkingSession' true to show a spinner.
      if (accessTokenParam && typeParam === 'recovery') {
         // Allow some time for Supabase onAuthStateChange to fire in AuthContext
         // If it takes too long, we might need to notify user, but usually it's fast.
         return;
      }
      
      // If no token and not authenticated, we stop checking and show Step 1 (Manual Code Entry)
      if (!isAuthenticated) {
          if (mounted) setCheckingSession(false);
      }
    };

    checkRecovery();
    
    // Listen specifically for the PASSWORD_RECOVERY event which signifies a successful link click
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (mounted) {
            setStep(2);
            setCheckingSession(false);
        }
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, [accessTokenParam, typeParam, isAuthenticated]);

  // 3. Pre-fill OTP if 'code' param exists (PKCE Flow or Manual Link)
  useEffect(() => {
    if (codeParam && step === 1) {
      const codeChars = codeParam.slice(0, 6).split('');
      const newOtp = [...otp];
      codeChars.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      
      // Optional: Auto-submit if we have a full code? 
      // User might prefer to click verify to be sure.
    }
  }, [codeParam, step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If authenticated, we just move to step 2 (Verification is implicit)
    if (isAuthenticated) {
        setStep(2);
        return;
    }

    const token = otp.join('');
    if (token.length < 6) return setError('Please enter the full 6-digit code.');
    if (!emailParam) return setError('Email context missing. Please request a new code.');

    setLoading(true);
    setError('');
    
    try {
      const result = await verifyOTP(emailParam, token, 'recovery');
      if (result.success) {
        setStep(2); 
      } else {
        setError(result.error || 'The code entered is invalid or has expired.');
      }
    } catch (err) {
      setError('Verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    setError('');

    try {
      // Use email from params OR authenticated user
      const effectiveEmail = emailParam || user?.email;

      // Prevent password reuse
      if (effectiveEmail) {
        const { data: reuseCheckData } = await supabase.auth.signInWithPassword({
            email: effectiveEmail,
            password: password
        });
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

  // --- RENDER LOADING STATE ---
  // If we suspect a recovery token is being processed, show spinner instead of Step 1 form
  if (checkingSession && (accessTokenParam || typeParam === 'recovery')) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-[#b4a070] mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-800">Verifying Link...</h2>
            <p className="text-gray-500 text-sm mt-2">Please wait while we secure your session.</p>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
           <div className="flex justify-center mb-6">
              <div className="bg-[#b4a070] text-black p-3 rounded-full shadow-lg">
                {step === 1 ? <KeyRound size={28} /> : <ShieldCheck size={28} />}
              </div>
           </div>
           <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             {step === 1 ? 'Verification' : 'Security Update'}
           </h2>
           <p className="text-gray-400 text-sm tracking-widest uppercase font-bold">
             {step === 1 ? 'Confirm Identity' : 'Create New Password'}
           </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left duration-300">
              <p className="text-gray-600 text-center mb-8 text-sm leading-relaxed">
                Enter the 6-digit code sent to <br/>
                <span className="font-bold text-gray-900">{emailParam || user?.email || 'your email'}</span>.
                {!codeParam && <br/><span className="text-xs text-gray-400 mt-1 block">(If you clicked a link, the code should auto-fill)</span>}
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="flex justify-between gap-2 px-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`reset-otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      // Only make readonly if we are effectively authenticated or loading
                      readOnly={isAuthenticated} 
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-14 md:w-12 md:h-16 text-center text-2xl font-black border-2 rounded-xl outline-none transition-all shadow-sm ${isAuthenticated ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-100 focus:border-[#b4a070] focus:ring-4 focus:ring-[#b4a070]/10'}`}
                    />
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || (!isAuthenticated && otp.some(d => !d))}
                    className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    <span className="text-lg">{loading ? 'Verifying...' : 'Verify Code'}</span>
                    {!loading && <ArrowRight size={22} className="text-[#b4a070]" />}
                  </button>
                </div>
                
                <div className="text-center pt-2">
                    <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right duration-500">
               <div className="mb-8 text-center">
                  <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm font-bold border border-green-100 inline-flex items-center gap-2">
                     <CheckCircle2 size={16} /> Identity Verified
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
                    {!loading && <CheckCircle2 size={22} className="text-[#b4a070]" />}
                  </button>
                </div>
              </form>
            </div>
          )}
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
