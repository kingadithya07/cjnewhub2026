
import React, { useState } from 'react';
// Fix: Ensure standard v6 imports
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { UserRole } from '../types';
import { Newspaper, User, Mail, ArrowRight, Lock, Shield, AlertCircle, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.READER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await register(name, email, password, role);
      if (result.success) {
        // For development/demo, we allow instant access. 
        // In production, user might need to verify email.
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-indigo-900 transition-colors gap-2 font-medium z-10">
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            <Newspaper size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Create Your Account</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
                <div>
                  <p className="font-bold">Registration Error</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] focus:border-transparent outline-none transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password" required minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] focus:border-transparent outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b4a070]" size={18} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b4a070] focus:border-transparent outline-none bg-white appearance-none cursor-pointer transition-all font-medium text-gray-700"
                  >
                    <option value={UserRole.READER}>Reader</option>
                    <option value={UserRole.EDITOR}>Editor</option>
                    <option value={UserRole.PUBLISHER}>Publisher</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Creating Account...' : 'Join NewsFlow Hub'}</span>
                {!loading && <ArrowRight size={20} className="text-[#b4a070]" />}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#b4a070] font-black hover:underline tracking-tight">
                SIGN IN NOW
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
