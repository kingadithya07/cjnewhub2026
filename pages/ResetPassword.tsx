
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { Lock, KeyRound, AlertCircle, ShieldCheck, ArrowRight, Mail, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { requestResetCode, resetPasswordWithCode } = useAuth();

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
      setError(res.error || 'Failed to send reset code.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
        setError("Code must be exactly 6 digits.");
        return;
    }
    setLoading(true);
    setError('');
    const res = await resetPasswordWithCode(email, code, password);
    setLoading(false);
    if (res.success) {
      alert("Success! Your password has been updated.");
      navigate('/login');
    } else {
      setError(res.error || 'Reset failed. Check approval status or code.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="bg-[#111827] p-8 md:p-10 text-center border-b-4 border-[#b4a070]">
           <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
           </h2>
           <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-bold">Security Recovery</p>
        </div>

        <div className="p-8 md:p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle size={18} className="shrink-0" /> 
              <p className="font-medium">{error}</p>
            </div>
          )}

          {step === 'EMAIL' && (
            <form onSubmit={handleRequestCode} className="space-y-6">
               <div className="text-center space-y-2 mb-6">
                  <p className="text-sm text-gray-500 px-4">Enter your registered email address to initiate a recovery request.</p>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                 <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="your@email.com" />
                 </div>
               </div>
               <button type="submit" disabled={loading} className="w-full bg-[#111827] text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                 {loading ? <RefreshCw className="animate-spin" size={20} /> : <>Initiate Recovery <ArrowRight size={18} className="text-[#b4a070]" /></>}
               </button>
            </form>
          )}

          {step === 'PENDING_APPROVAL' && (
            <div className="text-center space-y-6">
               <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-orange-600 animate-pulse">
                  <Smartphone size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Primary Approval Needed</h3>
               <p className="text-sm text-gray-500">
                  Since you are on a secondary device, you must approve this reset request from your **Primary Device**. 
               </p>
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Instructions</p>
                  <ol className="text-left text-xs text-gray-600 space-y-2 list-decimal ml-4">
                     <li>Open CJNewsHub on your Primary device.</li>
                     <li>Navigate to **Hub Console > Security**.</li>
                     <li>Click **Approve Request** on the reset alert.</li>
                     <li>Refresh this page to enter your code.</li>
                  </ol>
               </div>
               <button onClick={() => setStep('CODE')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl">Already Approved? Continue</button>
            </div>
          )}

          {step === 'CODE' && (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="text-center space-y-3 mb-6">
                 <div className="bg-[#b4a070]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-[#b4a070]">
                    <KeyRound size={32} />
                 </div>
                 <p className="text-xs text-gray-500">Enter the recovery code below.</p>
              </div>
              <div className="space-y-5">
                 <input type="text" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="000000" />
                 <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070]" placeholder="New Password" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                 {loading ? <RefreshCw className="animate-spin" size={20} /> : <>Complete Reset <ShieldCheck size={18} /></>}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
             <Link to="/login" className="text-gray-400 hover:text-gray-600 text-sm font-bold flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft size={16} /> Back to Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
