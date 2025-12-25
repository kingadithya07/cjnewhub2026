
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Newspaper, ArrowRight } from 'lucide-react';

export const AuthAction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  const content = {
    'password-reset-success': {
      title: 'Password Updated',
      message: 'Your password has been reset successfully. You can now sign in with your new credentials.',
      icon: <ShieldCheck size={48} className="text-green-500" />
    },
    'registration-success': {
      title: 'Welcome Aboard!',
      message: 'Your account has been created. Please check your email for a verification link to activate your access.',
      icon: <CheckCircle size={48} className="text-[#b4a070]" />
    }
  }[type || 'registration-success'] || {
    title: 'Success!',
    message: 'The operation completed successfully.',
    icon: <CheckCircle size={48} className="text-green-500" />
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#111827] p-8 text-center border-b-4 border-[#b4a070]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-[#b4a070]">
            <Newspaper size={32} />
          </div>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
             CJ<span className="text-[#b4a070]">NEWS</span>HUB
          </h2>
        </div>

        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {content.message}
          </p>

          <Link
            to="/login"
            className="w-full bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95"
          >
            <span>Proceed to Login</span>
            <ArrowRight size={20} className="text-[#b4a070]" />
          </Link>
        </div>
      </div>
    </div>
  );
};
