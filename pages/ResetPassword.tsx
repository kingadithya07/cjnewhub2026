
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Lock, KeyRound, AlertCircle, ShieldCheck, ArrowRight, Mail } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { requestResetCode, resetPasswordWithCode } = useAuth();

  const [step, setStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await requestResetCode(email);
    setLoading(false);
    if (res.success) setStep('CODE');
    else setError(res.error || 'Failed to send reset code.');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetPasswordWithCode(email, code, password);
    setLoading(false);
    if (res.success) {
      alert("Password reset successful! Please login.");
      navigate('/login');
    } else {
      setError(res.error || 'Reset failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
           <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Password Reset</h2>
           <p className="text-gray-400 text-xs tracking-widest uppercase font-bold">Secure Verification</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle size={18} /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
               <p className="text-sm text-gray-500 text-center">Enter your email to receive a secure 6-digit code.</p>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="Email Address" />
               </div>
               <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-4 rounded-xl shadow-lg">
                 {loading ? 'Processing...' : 'Send Verification Code'}
               </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">6-Digit Code</label>
                    <input type="text" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} className="w-full text-center text-2xl font-black py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="000000" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">New Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="••••••" />
                 </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg">Update Password</button>
              <button type="button" onClick={() => setStep('EMAIL')} className="w-full text-gray-400 text-sm">Wrong email?</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
