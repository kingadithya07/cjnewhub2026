
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, Lock, Mail, ArrowRight, AlertCircle, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'LOGIN' | 'VERIFY'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, verifyAccount } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else if (result.requiresVerification) {
      setMode('VERIFY');
    } else {
      setError(result.error || 'Invalid credentials.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyAccount(email, code);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error || 'Invalid code.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
          <h2 className="text-4xl font-black text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-widest uppercase mt-2 font-bold">
            {mode === 'LOGIN' ? 'Sign In' : 'Verification Required'}
          </p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle size={18} /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="email@hub.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="animate-spin" /> : 'Log In'} <ArrowRight size={20} className="text-[#b4a070]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center">
                 <KeyRound size={48} className="mx-auto text-[#b4a070] mb-4" />
                 <p className="text-sm text-gray-500 mb-6">Enter the 6-digit verification code we just sent to your email.</p>
                 <input type="text" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} className="w-full text-center text-4xl font-black py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="000000" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-5 rounded-2xl shadow-xl">Verify & Continue</button>
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-gray-400 text-sm">Cancel</button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">Need an account? <Link to="/register" className="text-[#b4a070] font-black">Register Now</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};
