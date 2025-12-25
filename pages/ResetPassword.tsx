
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP, updatePassword } = useAuth();

  const email = searchParams.get('email') || '';
  
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

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
    const token = otp.join('');
    if (token.length < 6) return setError('Please enter the full 6-digit code.');

    setLoading(true);
    setError('');
    
    try {
      const result = await verifyOTP(email, token, 'recovery');
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'Invalid or expired recovery code.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
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
      const result = await updatePassword(password);
      if (result.success) {
        navigate('/auth-success?type=password-reset-success');
      } else {
        setError(result.error || 'Failed to update password.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            {step === 1 ? <KeyRound size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            {step === 1 ? 'Verify Reset Code' : 'Set New Password'}
          </h2>
          <p className="text-gray-400 text-sm">
            {step === 1 ? (
              <>We've sent a recovery code to <strong>{email}</strong></>
            ) : (
              'Choose a strong password to secure your account'
            )}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#b4a070] focus:ring-4 focus:ring-[#b4a070]/10 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                {!loading && <ArrowRight size={20} className="text-[#b4a070]" />}
              </button>
              
              <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest mt-4">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password" required minLength={6} autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password" required minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || password !== confirmPassword}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
                {!loading && <CheckCircle2 size={20} className="text-[#b4a070]" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
