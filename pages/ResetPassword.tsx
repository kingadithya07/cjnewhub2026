
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, Newspaper, Loader2, RefreshCw } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP, updatePassword, isAuthenticated } = useAuth();

  // Extract email/code from URL
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || searchParams.get('token');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [error, setError] = useState('');

  // 1. Check for existing session or Magic Link recovery
  useEffect(() => {
    const checkSession = async () => {
      // If we are already authenticated (e.g. Magic Link clicked and processed by AuthContext), move to step 2
      if (isAuthenticated) {
        setStep(2);
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
          setStep(2);
        }
      });
      
      setInitialCheckDone(true);
      return () => subscription.unsubscribe();
    };

    checkSession();
  }, [isAuthenticated]);

  // 2. Pre-fill OTP if present in URL (The "Internal" Generation)
  useEffect(() => {
    if (codeParam) {
      // If code is provided in link, auto-fill the boxes
      // Truncate to 6 if it's longer just for display safety, though standard OTP is 6
      const codeChars = codeParam.slice(0, 6).split('');
      const newOtp = [...otp];
      codeChars.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
    }
  }, [codeParam]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
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
    const token = otp.join('');
    if (token.length < 6) return setError('Please enter the full 6-digit code.');
    if (!emailParam) return setError('Email context missing. Please request a new code.');

    setLoading(true);
    setError('');
    
    try {
      // Step 1: Verify the 6-digit PIN manually
      const result = await verifyOTP(emailParam, token, 'recovery');
      if (result.success) {
        setStep(2); 
      } else {
        setError(result.error || 'The code entered is invalid or has expired.');
      }
    } catch (err) {
      setError('Verification failed. Please check your connection and try again.');
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
      // --- PASSWORD HISTORY CHECK ---
      // We attempt to sign in with the NEW password.
      // If it SUCCEEDS, it means the password is the same as the old one.
      // If it FAILS (Invalid login), it means the password is indeed new.
      
      // Note: This check only works if we have the email context.
      if (emailParam) {
        const { data: reuseCheckData, error: reuseCheckError } = await supabase.auth.signInWithPassword({
            email: emailParam,
            password: password
        });

        if (reuseCheckData.user) {
            setLoading(false);
            setError("You cannot use your previous password. Please choose a different one.");
            return;
        }
      }

      // If sign-in failed (good thing), we proceed to update.
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

  // If processing magic link hash, show loader briefly
  if (!initialCheckDone && window.location.hash.includes('access_token')) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#b4a070]" size={48} />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Newspaper Header Styling */}
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
                Verification code generated from secure link for <br/>
                <span className="font-bold text-gray-900">{emailParam || 'your account'}</span>.
                <br/><span className="text-xs text-indigo-600 font-bold mt-1 block">Code auto-filled from link.</span>
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
                      // Make it readOnly if auto-filled to emphasize "Internal Generation", 
                      // but allow edit in case of manual entry fallback
                      readOnly={!!codeParam} 
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-14 md:w-12 md:h-16 text-center text-2xl font-black border-2 rounded-xl outline-none transition-all shadow-sm ${codeParam ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-100 focus:border-[#b4a070] focus:ring-4 focus:ring-[#b4a070]/10'}`}
                    />
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.some(d => !d)}
                    className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    <span className="text-lg">{loading ? 'Verifying...' : 'Verify Code'}</span>
                    {!loading && <ArrowRight size={22} className="text-[#b4a070]" />}
                  </button>
                </div>
                
                {!codeParam && (
                    <div className="text-center pt-2">
                    <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                    </div>
                )}
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right duration-500">
               <div className="mb-8 text-center">
                  <p className="text-gray-600 text-sm">Identity verified. Please set your new password below.</p>
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
