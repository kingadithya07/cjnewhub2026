
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, User, Mail, ArrowRight, Lock, Shield, AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export const Register: React.FC = () => {
  const [step, setStep] = useState<'DETAILS' | 'VERIFY'>('DETAILS');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.READER);
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, verifyAccount } = useAuth();
  const navigate = useNavigate();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(name, email, password, role);
    setLoading(false);
    if (result.success) {
      setStep('VERIFY');
    } else {
      setError(result.error || 'Failed to start registration.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await verifyAccount(email, code);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid verification code.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            {step === 'DETAILS' ? 'Create Account' : 'Verify Identity'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-4">
              <AlertCircle size={18} className="shrink-0" /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          {step === 'DETAILS' ? (
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="Full Name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#b4a070]" placeholder="••••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-4 py-3 border rounded-xl bg-white outline-none">
                    <option value={UserRole.READER}>Reader</option>
                    <option value={UserRole.EDITOR}>Editor</option>
                    <option value={UserRole.PUBLISHER}>Publisher</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-all">
                {loading ? 'Processing...' : 'Register & Get Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="text-center">
                 <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <KeyRound size={32} />
                 </div>
                 <p className="text-sm text-gray-600 mb-6">A 6-digit verification code was sent to <strong>{email}</strong>.</p>
                 <input 
                   type="text" required maxLength={6}
                   value={code} onChange={e => setCode(e.target.value)}
                   className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 outline-none"
                   placeholder="000000"
                 />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-4 rounded-xl shadow-lg">
                {loading ? 'Verifying...' : 'Complete Registration'}
              </button>
              <button type="button" onClick={() => setStep('DETAILS')} className="w-full text-gray-500 text-sm font-bold">Change Email</button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-500">Already have an account? <span className="text-[#b4a070] font-bold">Log In</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
};
