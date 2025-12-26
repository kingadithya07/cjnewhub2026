
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, EPaperPage, Classified, Device } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  FileText, Scissors, Layout, Save, X, Star, Settings, MessageCircle, 
  Shield, Smartphone, AlertTriangle, User as UserIcon, Database, Check, 
  Newspaper, Store, Calendar, Image as ImageIcon, Monitor, Lock, ArrowRight, Loader2, Key
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_EPAPER, MOCK_CLASSIFIEDS } from '../services/mockData';
import { ChatSystem } from '../modules/communication/ChatSystem';
import { getDeviceId } from '../utils/device';

export const Dashboard: React.FC = () => {
  const { user, isDeviceApproved, approveDevice, revokeDevice } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingReset, setPendingReset] = useState(false);

  // Create Mode States
  const [showCreateModal, setShowCreateModal] = useState<'NONE' | 'ARTICLE' | 'EPAPER' | 'CLASSIFIED'>('NONE');
  const [newEpaper, setNewEpaper] = useState({ date: new Date().toISOString().split('T')[0], pageNumber: 1, imageUrl: '' });
  const [newClassified, setNewClassified] = useState({ title: '', content: '', price: '', location: '', category: 'General' });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        // Articles
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        setArticles(art && art.length > 0 ? art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})) : MOCK_ARTICLES);

        // EPaper
        const { data: ep } = await supabase.from('epaper_pages').select('*').order('date', { ascending: false }).order('page_number', { ascending: true });
        setEpaperPages(ep && ep.length > 0 ? ep.map(p => ({...p, pageNumber: p.page_number, imageUrl: p.image_url})) : MOCK_EPAPER);

        // Classifieds
        const { data: cls } = await supabase.from('classifieds').select('*').order('created_at', { ascending: false });
        setClassifieds(cls && cls.length > 0 ? cls.map(c => ({...c, createdAt: c.created_at})) : MOCK_CLASSIFIEDS);

        // Devices & Profile Status
        const { data: dev } = await supabase.from('user_devices').select('*').eq('profile_id', user.id);
        if(dev) setDevices(dev);

        const { data: prof } = await supabase.from('profiles').select('reset_approval_status').eq('id', user.id).maybeSingle();
        setPendingReset(prof?.reset_approval_status === 'PENDING');

    } catch (e) {
        console.error("Dashboard Load Error", e);
        setArticles(MOCK_ARTICLES);
        setEpaperPages(MOCK_EPAPER);
        setClassifieds(MOCK_CLASSIFIEDS);
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleAddEpaper = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('epaper_pages').insert({
        date: newEpaper.date,
        page_number: newEpaper.pageNumber,
        image_url: newEpaper.imageUrl || 'https://picsum.photos/1200/1800'
    });
    if (!error) { setShowCreateModal('NONE'); loadData(); }
  };

  const handleAddClassified = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('classifieds').insert({
        ...newClassified,
        status: 'ACTIVE'
    });
    if (!error) { setShowCreateModal('NONE'); loadData(); }
  };

  if (!user) return <div className="p-20 text-center font-black text-gray-400 uppercase tracking-widest">Access Denied</div>;

  const tabs = [
    { id: 'ARTICLES', label: 'ARTICLES', icon: <FileText size={16}/> },
    { id: 'EPAPER', label: 'E-PAPER', icon: <Newspaper size={16}/> },
    { id: 'CLASSIFIEDS', label: 'CLASSIFIEDS', icon: <Store size={16}/> },
    { id: 'DEVICES', label: 'SECURITY', icon: <Shield size={16}/> },
    { id: 'COMMUNICATION', label: 'CHATS', icon: <MessageCircle size={16}/> },
  ];

  const primaryDevice = devices.find(d => d.is_primary);
  const isCurrentlyPrimary = primaryDevice?.device_id === getDeviceId();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase font-serif tracking-tight">Hub <span className="text-[#b4a070]">Console</span></h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> {user.name} • {user.role}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button 
             onClick={() => {
                if(activeTab === 'EPAPER') setShowCreateModal('EPAPER');
                else if(activeTab === 'CLASSIFIEDS') setShowCreateModal('CLASSIFIED');
                else setShowCreateModal('ARTICLE');
             }} 
             className="flex-1 md:flex-none bg-[#111827] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
           >
              <Plus size={18} className="text-[#b4a070]" /> New Entry
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-100 overflow-x-auto scrollbar-hide bg-gray-50/50 p-1.5 rounded-2xl">
         {tabs.map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setSearchParams({ tab: tab.id })} 
             className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Accessing Archives...</p>
          </div>
      ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'ARTICLES' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em]">
                        <tr>
                            <th className="px-6 py-5">Publication</th>
                            <th className="px-6 py-5">Author</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {articles.map(art => (
                            <tr key={art.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img src={art.thumbnailUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-bold text-gray-900 line-clamp-1">{art.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-gray-600 font-medium">{art.authorName}</td>
                                <td className="px-6 py-5">
                                    <span className={`flex items-center gap-1.5 font-black text-[9px] tracking-widest uppercase ${art.status === 'PUBLISHED' ? 'text-green-600' : 'text-orange-500'}`}>
                                        {art.status === 'PUBLISHED' ? <CheckCircle size={12}/> : <Clock size={12}/>} {art.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={18}/></button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'EPAPER' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {epaperPages.map(page => (
                    <div key={page.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                        <div className="relative aspect-[3/4]">
                            <img src={page.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="p-4 border-t border-gray-50 bg-white flex justify-between items-center">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Digital Edition</p>
                                <p className="text-xs font-bold text-gray-900">{page.date}</p>
                            </div>
                            <div className="bg-gray-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter text-gray-600">P. {page.pageNumber}</div>
                        </div>
                    </div>
                ))}
                </div>
            )}

            {activeTab === 'CLASSIFIEDS' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em]">
                        <tr>
                            <th className="px-6 py-5">Listing</th>
                            <th className="px-6 py-5">Category</th>
                            <th className="px-6 py-5">Valuation</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {classifieds.map(cl => (
                            <tr key={cl.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-5 font-bold text-gray-900">{cl.title}</td>
                                <td className="px-6 py-5 text-gray-500 font-medium">{cl.category}</td>
                                <td className="px-6 py-5 font-black text-emerald-600">{cl.price}</td>
                                <td className="px-6 py-5 text-right space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit3 size={18}/></button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'DEVICES' && (
                <div className="space-y-8">
                {/* Security Action Alerts */}
                {pendingReset && isCurrentlyPrimary && (
                    <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex items-center justify-between gap-4 animate-bounce">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-200 p-3 rounded-2xl text-orange-700"><Key size={24} /></div>
                            <div>
                                <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Pending Password Reset</h4>
                                <p className="text-gray-500 text-sm">A reset request was initiated from a secondary device. Approve it to proceed.</p>
                            </div>
                        </div>
                        <button onClick={() => approveDevice('AUTO_RESET')} className="bg-[#111827] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">APPROVE REQUEST</button>
                    </div>
                )}

                <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight"><Shield size={28} className="text-[#b4a070]"/> Security Hub</h3>
                        <p className="text-indigo-200 text-sm mt-2 font-medium">Control device access and sensitive security actions from your primary station.</p>
                    </div>
                    {isCurrentlyPrimary && (
                        <div className="relative z-10 bg-[#b4a070] text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">PRIMARY AUTHORITY</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map(device => {
                        const isThisDevice = device.device_id === getDeviceId();
                        return (
                            <div key={device.id} className={`p-6 rounded-3xl border-2 transition-all ${isThisDevice ? 'border-[#b4a070] bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${isThisDevice ? 'bg-[#b4a070]/10 text-[#b4a070]' : 'bg-white text-gray-400 shadow-sm'}`}>
                                        {device.device_name.includes('Chrome') ? <Monitor size={28}/> : <Smartphone size={28}/>}
                                    </div>
                                    {device.is_primary && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-100">PRIMARY</span>}
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{device.device_name}</h4>
                                
                                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest ${device.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                        {device.status}
                                    </span>
                                    {device.status === 'PENDING' && isCurrentlyPrimary && (
                                        <button 
                                            onClick={() => { approveDevice(device.device_id); loadData(); }}
                                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                                        >
                                            Approve Access
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>
            )}

            {activeTab === 'COMMUNICATION' && <ChatSystem />}
          </div>
      )}

      {/* CREATE MODALS */}
      {showCreateModal === 'EPAPER' && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-gray-100">
              <div className="bg-[#111827] p-8 text-white flex justify-between items-center border-b-4 border-[#b4a070]">
                 <div>
                    <h3 className="font-black text-xl uppercase tracking-tight">Upload Edition</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Archive Entry System</p>
                 </div>
                 <button onClick={() => setShowCreateModal('NONE')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <form onSubmit={handleAddEpaper} className="p-10 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Edition Date</label>
                    <input type="date" required value={newEpaper.date} onChange={e => setNewEpaper({...newEpaper, date: e.target.value})} className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Sequence Number (Page)</label>
                    <input type="number" required value={newEpaper.pageNumber} onChange={e => setNewEpaper({...newEpaper, pageNumber: parseInt(e.target.value)})} className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Cloud Storage URL</label>
                    <input type="url" value={newEpaper.imageUrl} onChange={e => setNewEpaper({...newEpaper, imageUrl: e.target.value})} placeholder="https://cdn.example.com/page.jpg" className="w-full px-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#b4a070] bg-gray-50/50" />
                 </div>
                 <button type="submit" className="w-full bg-[#111827] text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-black transition-all uppercase tracking-widest text-sm mt-4">Execute Upload</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
