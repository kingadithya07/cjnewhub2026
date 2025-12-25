
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Mail, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const VerifyOTP: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const email = searchParams.get('email') || '';
  const type = (searchParams.get('type') as 'signup' | 'recovery') || 'signup';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.join('');
    if (token.length < 6) return setError('Please enter the full 6-digit code.');

    setLoading(true);
    setError('');
    
    try {
      const result = await verifyOTP(email, token, type);
      if (result.success) {
        const successType = type === 'signup' ? 'account-created' : 'password-reset-success';
        navigate(`/auth-success?type=${successType}`);
      } else {
        setError(result.error || 'Invalid or expired code.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    // Simulation for now, but usually would call a supabase resend method
    setTimeout(() => {
        setResending(false);
        alert("Verification code resent to " + email);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Verify Your Email</h2>
          <p className="text-gray-400 text-sm">We've sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in duration-200">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#b4a070] focus:ring-4 focus:ring-[#b4a070]/10 outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.some(d => !d)}
              className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
              {!loading && <CheckCircle2 size={20} className="text-[#b4a070]" />}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
              <button 
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#b4a070] font-black hover:underline uppercase text-xs tracking-wider flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
