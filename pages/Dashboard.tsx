
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, EPaperPage, Classified } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, Power, 
  Save, X, Star, Settings, MessageCircle, Shield, Smartphone, AlertTriangle, User as UserIcon, Database, Check, Newspaper, Store, Calendar, Image as ImageIcon
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ChatSystem } from '../modules/communication/ChatSystem';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTabParam = searchParams.get('tab') as 'ARTICLES' | 'EPAPER' | 'CLASSIFIEDS' | 'COMMUNICATION' | 'SECURITY' | null;
  const activeTab = activeTabParam || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({profiles: false, articles: false, epaper: false});
  const [articles, setArticles] = useState<Article[]>([]);
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);

  const [profileEditData, setProfileEditData] = useState({ name: user?.name || '', email: user?.email || '' });

  const loadData = async () => {
    setLoading(true);
    try {
        // DB Integrity Check
        const { error: pErr } = await supabase.from('profiles').select('id').limit(1);
        const { error: aErr } = await supabase.from('articles').select('id').limit(1);
        const { error: eErr } = await supabase.from('epaper_pages').select('id').limit(1);
        setDbStatus({ profiles: !pErr, articles: !aErr, epaper: !eErr });

        // Fetch Articles
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})));

        // Fetch E-Paper
        const { data: ep } = await supabase.from('epaper_pages').select('*').order('date', { ascending: false }).order('page_number', { ascending: true });
        if(ep) setEpaperPages(ep.map(p => ({...p, pageNumber: p.page_number, imageUrl: p.image_url})));

        // Fetch Classifieds
        const { data: cls } = await supabase.from('classifieds').select('*').order('created_at', { ascending: false });
        if(cls) setClassifieds(cls.map(c => ({...c, createdAt: c.created_at})));

    } catch (e) { console.error("Dashboard Load Error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRequestProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({ name: profileEditData.name }).eq('id', user?.id);
    if (!error) alert("Profile Updated Successfully");
    else alert("Error updating profile: " + error.message);
  };

  if (!user) return <div className="p-20 text-center font-bold text-gray-400">ACCESS DENIED</div>;

  const tabs = [
    { id: 'ARTICLES', label: 'ARTICLES', icon: <FileText size={16}/> },
    { id: 'EPAPER', label: 'E-PAPER', icon: <Newspaper size={16}/> },
    { id: 'CLASSIFIEDS', label: 'CLASSIFIEDS', icon: <Store size={16}/> },
    { id: 'COMMUNICATION', label: 'CHATS', icon: <MessageCircle size={16}/> },
    { id: 'SECURITY', label: 'SECURITY', icon: <Shield size={16}/> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Hub <span className="text-[#b4a070]">Console</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Logged in as {user.name} • {user.role}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={loadData} className="bg-gray-100 p-2.5 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"><Database size={20}/></button>
           <button className="bg-[#111827] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all">
              <Plus size={18} /> New Entry
           </button>
        </div>
      </div>

      {/* Responsive Tabs */}
      <div className="flex space-x-1 border-b overflow-x-auto scrollbar-hide bg-gray-50 p-1 rounded-xl">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setSearchParams({ tab: tab.id })}
             className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black transition-all whitespace-nowrap rounded-lg ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {/* Tab Content: ARTICLES */}
      {activeTab === 'ARTICLES' && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-6 py-4">Article</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {articles.map(art => (
                      <tr key={art.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <img src={art.thumbnailUrl} className="w-10 h-10 rounded-lg object-cover" />
                               <span className="font-bold text-gray-900 line-clamp-1">{art.title}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-gray-600">{art.authorName}</td>
                         <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold">{art.category}</span></td>
                         <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 font-bold text-[10px] ${art.status === 'PUBLISHED' ? 'text-green-600' : 'text-orange-500'}`}>
                               {art.status === 'PUBLISHED' ? <CheckCircle size={12}/> : <Clock size={12}/>} {art.status}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right space-x-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                            <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {articles.length === 0 && <div className="p-20 text-center text-gray-400 italic">No articles found. Use "New Entry" to begin.</div>}
          </div>
        </div>
      )}

      {/* Tab Content: EPAPER */}
      {activeTab === 'EPAPER' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {epaperPages.map(page => (
                 <div key={page.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-lg transition-all">
                    <div className="relative aspect-[3/4] bg-gray-100">
                       <img src={page.imageUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="bg-white p-2 rounded-lg text-gray-900 hover:bg-[#b4a070] hover:text-white transition-colors"><Scissors size={18}/></button>
                          <button className="bg-white p-2 rounded-lg text-gray-900 hover:bg-[#b4a070] hover:text-white transition-colors"><Edit3 size={18}/></button>
                       </div>
                    </div>
                    <div className="p-4 border-t flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Edition Date</p>
                          <p className="text-sm font-bold text-gray-900">{page.date}</p>
                       </div>
                       <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black">PAGE {page.pageNumber}</div>
                    </div>
                 </div>
              ))}
              <button className="border-2 border-dashed border-gray-200 rounded-xl aspect-[3/4] flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-all gap-2 group">
                 <div className="bg-gray-50 p-4 rounded-full group-hover:bg-indigo-50 transition-colors"><Plus size={32}/></div>
                 <span className="font-bold text-xs uppercase tracking-widest">Upload Page</span>
              </button>
           </div>
        </div>
      )}

      {/* Tab Content: CLASSIFIEDS */}
      {activeTab === 'CLASSIFIEDS' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-in fade-in duration-300">
           <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {classifieds.map(cl => (
                      <tr key={cl.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-bold text-gray-900">{cl.title}</td>
                         <td className="px-6 py-4 text-gray-600">{cl.category}</td>
                         <td className="px-6 py-4 font-bold text-emerald-600">{cl.price}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${cl.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                               {cl.status}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right space-x-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                            <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {classifieds.length === 0 && <div className="p-20 text-center text-gray-400 italic">No classifieds found.</div>}
        </div>
      )}

      {/* Tab Content: COMMUNICATION */}
      {activeTab === 'COMMUNICATION' && <ChatSystem />}

      {/* Tab Content: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
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
                 <button type="submit" className="w-full bg-[#111827] text-white font-bold py-3 rounded-xl hover:bg-black shadow-md transition-all">
                    Update Profile
                 </button>
              </form>
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Database size={20} className="text-emerald-600"/> System Health</h3>
              <div className="space-y-3">
                 {[
                   { name: 'Profiles Table', ok: dbStatus.profiles },
                   { name: 'Articles Table', ok: dbStatus.articles },
                   { name: 'E-Paper Table', ok: dbStatus.epaper }
                 ].map(stat => (
                   <div key={stat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-lg ${stat.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {stat.ok ? <Check size={14}/> : <X size={14}/>}
                         </div>
                         <span className="text-sm font-bold text-gray-700">{stat.name}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase ${stat.ok ? 'text-emerald-600' : 'text-red-600'}`}>{stat.ok ? 'Online' : 'Error'}</span>
                   </div>
                 ))}
                 {!dbStatus.epaper && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[10px] leading-relaxed flex gap-3 uppercase font-black">
                      <AlertTriangle size={16} className="shrink-0" />
                      <p>Warning: Missing database tables detected. Please run the full site SQL in your Supabase console to enable all features.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
