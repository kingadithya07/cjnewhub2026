
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Lock, KeyRound, AlertCircle, ShieldCheck, ArrowRight, Mail, ArrowLeft, RefreshCw, Smartphone, Search } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { requestResetCode, checkResetStatus, resetPasswordWithCode } = useAuth();

  const [step, setStep] = useState<'EMAIL' | 'CODE' | 'PENDING_APPROVAL'>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prefill = localStorage.getItem('newsflow_reset_email_prefill');
    if (prefill) {
      setEmail(prefill);
      localStorage.removeItem('newsflow_reset_email_prefill');
    }
  }, []);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await requestResetCode(email);
    setLoading(false);
    
    if (res.success) {
      if (res.requiresPrimaryApproval) {
        setStep('PENDING_APPROVAL');
      } else {
        setStep('CODE');
      }
    } else {
      setError(res.error || 'Account synchronization error.');
    }
  };

  const verifyStatus = async () => {
      setLoading(true);
      const res = await checkResetStatus(email);
      setLoading(false);
      if (res.approved) {
          setStep('CODE');
      } else {
          setError("Request still pending on primary device.");
      }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await resetPasswordWithCode(email, code, password);
    setLoading(false);
    if (res.success) {
      alert("Account Recovery Successful.");
      navigate('/login');
    } else {
      setError(res.error || 'Reset failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="bg-[#111827] p-10 text-center border-b-4 border-[#b4a070]">
           <h2 className="text-3xl font-black text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
           </h2>
           <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-black mt-2">Recovery Console</p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" /> 
              <p className="font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          {step === 'EMAIL' && (
            <form onSubmit={handleRequestCode} className="space-y-6">
               <p className="text-xs text-center text-gray-500 uppercase font-bold tracking-widest leading-loose">Enter your email to initiate hardware-locked recovery.</p>
               <div>
                 <div className="relative">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-4 py-5 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" placeholder="Identity Email" />
                 </div>
               </div>
               <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em]">
                 {loading ? <RefreshCw className="animate-spin" /> : 'Request Code'}
               </button>
            </form>
          )}

          {step === 'PENDING_APPROVAL' && (
            <div className="text-center space-y-8">
               <div className="bg-orange-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-orange-600 animate-pulse border-2 border-orange-100">
                  <Smartphone size={48} />
               </div>
               <div className="space-y-2">
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Hardware Approval Required</h3>
                   <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">A recovery code has been sent to your Primary Hub Station for approval.</p>
               </div>
               <button onClick={verifyStatus} disabled={loading} className="w-full bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
                  {loading ? <RefreshCw className="animate-spin" /> : <><Search size={18} /> Check Approval Status</>}
               </button>
               <p className="text-[9px] text-gray-400 uppercase tracking-widest">Refresh after approving on primary device</p>
            </div>
          )}

          {step === 'CODE' && (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="text-center space-y-4 mb-6">
                 <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                    <ShieldCheck size={40} />
                 </div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identity Verified. Set New Access Key.</p>
              </div>
              <div className="space-y-4">
                 <input type="text" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl font-black tracking-[0.4em] py-5 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" placeholder="000000" />
                 <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-5 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" placeholder="New Access Key" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-[0.2em]">
                 {loading ? <RefreshCw className="animate-spin" /> : 'Finalize Recovery'}
              </button>
            </form>
          )}

          <div className="text-center mt-10">
             <Link to="/login" className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Return to Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
