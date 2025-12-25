
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, Advertisement, EPaperPage, WatermarkSettings, Classified } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, Power, 
  Save, X, Star, Settings, MessageCircle, Shield, Smartphone, AlertTriangle, User as UserIcon, Database, Check
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ChatSystem } from '../modules/communication/ChatSystem';
import { getDeviceId } from '../utils/device';

export const Dashboard: React.FC = () => {
  const { user, isDeviceApproved, refreshDeviceStatus } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTabParam = searchParams.get('tab') as 'ARTICLES' | 'ADS' | 'EPAPER' | 'SETTINGS' | 'TAXONOMY' | 'CLASSIFIEDS' | 'COMMUNICATION' | 'SECURITY' | null;
  const activeTab = activeTabParam || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{profiles: boolean, articles: boolean}>({profiles: false, articles: false});
  const [devices, setDevices] = useState<any[]>([]);
  const [securityRequests, setSecurityRequests] = useState<any[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Modals/Forms
  const [profileEditData, setProfileEditData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [isEditProfilePending, setIsEditProfilePending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
        // Check DB Integrity
        const { error: pErr } = await supabase.from('profiles').select('count').limit(1);
        const { error: aErr } = await supabase.from('articles').select('count').limit(1);
        setDbStatus({ profiles: !pErr, articles: !aErr });

        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})));

        if (user) {
          // Security features
          const { data: dev } = await supabase.from('trusted_devices').select('*').eq('profile_id', user.id);
          if (dev) setDevices(dev);
        }
    } catch (e) { console.error("Fetch error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRequestProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('profiles').update({ name: profileEditData.name }).eq('id', user?.id);
    alert("Profile Updated Successfully");
  };

  if (!user) return <div className="p-20 text-center">Access Denied</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
          <p className="text-gray-500 mt-1">Logged in as {user.name} ({user.role})</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setSearchParams({ tab: 'SECURITY' })} className="bg-gray-100 p-2 rounded-lg text-gray-600 hover:bg-gray-200"><Shield size={20}/></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b overflow-x-auto scrollbar-hide">
         {['ARTICLES', 'COMMUNICATION', 'SECURITY'].map(tab => (
           <button 
             key={tab}
             onClick={() => setSearchParams({ tab })}
             className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Content: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
           
           {/* Profile Management */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon size={20} className="text-indigo-600"/> Profile Settings</h3>
              <form onSubmit={handleRequestProfileUpdate} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input 
                       type="text" 
                       value={profileEditData.name} 
                       onChange={e => setProfileEditData({...profileEditData, name: e.target.value})}
                       className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
                 <div className="opacity-50">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                    <input type="email" disabled value={profileEditData.email} className="w-full border p-3 rounded-xl bg-gray-50" />
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md">
                    Update Profile
                 </button>
              </form>
           </div>

           {/* Backend Integrity Check */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Database size={20} className="text-emerald-600"/> Backend Integrity</h3>
              <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest font-bold">System Health Check</p>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${dbStatus.profiles ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {dbStatus.profiles ? <Check size={18}/> : <X size={18}/>}
                       </div>
                       <div>
                          <p className="text-sm font-bold">Profiles Table</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{dbStatus.profiles ? 'Operational' : 'Missing / Error'}</p>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${dbStatus.articles ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {dbStatus.articles ? <Check size={18}/> : <X size={18}/>}
                       </div>
                       <div>
                          <p className="text-sm font-bold">Articles Table</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{dbStatus.articles ? 'Operational' : 'Missing / Error'}</p>
                       </div>
                    </div>
                 </div>
                 {!dbStatus.profiles && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex gap-3">
                      <AlertTriangle size={16} className="shrink-0" />
                      <p><strong>Warning:</strong> Profiles table not detected. Registration and data syncing will fail. Please run the SQL script in your Supabase Editor.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Content: ARTICLES */}
      {activeTab === 'ARTICLES' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300 min-h-[400px]">
           <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Manage Articles</h3>
           </div>
           <div className="p-12 text-center text-gray-400">
              <p>Article management interface loaded. Use the Security tab to verify database connection.</p>
           </div>
        </div>
      )}

      {/* Content: COMMUNICATION */}
      {activeTab === 'COMMUNICATION' && <ChatSystem />}
    </div>
  );
};
