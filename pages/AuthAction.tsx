
import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShieldCheck, ArrowRight, Newspaper } from 'lucide-react';

export const AuthAction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'account-created';

  const config = {
    'account-created': {
      title: 'Account Created Successfully!',
      subtitle: 'Welcome to CJNews Hub. Your email has been verified and your account is ready to use.',
      icon: <CheckCircle size={48} className="text-[#b4a070]" />,
      actionLabel: 'Go to Dashboard',
      actionPath: '/dashboard'
    },
    'password-reset-success': {
      title: 'Password Changed!',
      subtitle: 'Security update complete. Your password has been successfully updated.',
      icon: <ShieldCheck size={48} className="text-[#b4a070]" />,
      actionLabel: 'Login with New Password',
      actionPath: '/login'
    }
  }[type] || {
    title: 'Success!',
    subtitle: 'The action was completed successfully.',
    icon: <CheckCircle size={48} className="text-[#b4a070]" />,
    actionLabel: 'Return Home',
    actionPath: '/'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center text-center p-12 animate-in zoom-in duration-500">
        
        <div className="bg-[#111827] w-full p-8 -mt-12 -mx-12 mb-8 flex flex-col items-center">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-4 text-[#b4a070]">
              <Newspaper size={40} />
           </div>
           <h2 className="text-3xl font-black text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
        </div>

        <div className="mb-6 flex justify-center bg-gray-50 p-6 rounded-full">
          {config.icon}
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
          {config.title}
        </h1>
        
        <p className="text-gray-500 mb-10 leading-relaxed text-lg px-4">
          {config.subtitle}
        </p>

        <button
          onClick={() => navigate(config.actionPath)}
          className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl active:scale-95 group"
        >
          <span className="text-lg">{config.actionLabel}</span>
          <ArrowRight size={24} className="text-[#b4a070] group-hover:translate-x-1 transition-transform" />
        </button>

        <Link to="/" className="mt-8 text-gray-400 hover:text-gray-900 font-bold uppercase text-xs tracking-widest transition-colors">
          Return to Homepage
        </Link>
      </div>
    </div>
  );
};
