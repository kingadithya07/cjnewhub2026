
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, EPaperPage, Classified, Device } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, Power, 
  Save, X, Star, Settings, MessageCircle, Shield, Smartphone, AlertTriangle, User as UserIcon, Database, Check, Newspaper, Store, Calendar, Image as ImageIcon, Monitor, Smartphone as Phone, Lock
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ChatSystem } from '../modules/communication/ChatSystem';
import { getDeviceId } from '../utils/device';

export const Dashboard: React.FC = () => {
  const { user, isDeviceApproved, approveDevice } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // Create Mode States
  const [showCreateModal, setShowCreateModal] = useState<'NONE' | 'ARTICLE' | 'EPAPER' | 'CLASSIFIED'>('NONE');
  const [newEpaper, setNewEpaper] = useState({ date: new Date().toISOString().split('T')[0], pageNumber: 1, imageUrl: '' });
  const [newClassified, setNewClassified] = useState({ title: '', content: '', price: '', location: '', category: 'General' });

  const loadData = async () => {
    setLoading(true);
    try {
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})));

        const { data: ep } = await supabase.from('epaper_pages').select('*').order('date', { ascending: false }).order('page_number', { ascending: true });
        if(ep) setEpaperPages(ep.map(p => ({...p, pageNumber: p.page_number, imageUrl: p.image_url})));

        const { data: cls } = await supabase.from('classifieds').select('*').order('created_at', { ascending: false });
        if(cls) setClassifieds(cls.map(c => ({...c, createdAt: c.created_at})));

        const { data: dev } = await supabase.from('user_devices').select('*').eq('profile_id', user?.id);
        if(dev) setDevices(dev);
    } finally { setLoading(false); }
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

  if (!user) return <div className="p-20 text-center">ACCESS DENIED</div>;

  const tabs = [
    { id: 'ARTICLES', label: 'ARTICLES', icon: <FileText size={16}/> },
    { id: 'EPAPER', label: 'E-PAPER', icon: <Newspaper size={16}/> },
    { id: 'CLASSIFIEDS', label: 'CLASSIFIEDS', icon: <Store size={16}/> },
    { id: 'DEVICES', label: 'DEVICES', icon: <Smartphone size={16}/> },
    { id: 'COMMUNICATION', label: 'CHATS', icon: <MessageCircle size={16}/> },
  ];

  const primaryDevice = devices.find(d => d.is_primary);
  const isCurrentlyPrimary = primaryDevice?.device_id === getDeviceId();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase font-serif">Hub <span className="text-[#b4a070]">Console</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Logged in as {user.name} • {user.role}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => {
                if(activeTab === 'EPAPER') setShowCreateModal('EPAPER');
                else if(activeTab === 'CLASSIFIEDS') setShowCreateModal('CLASSIFIED');
                else setShowCreateModal('ARTICLE');
             }} 
             className="bg-[#111827] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
           >
              <Plus size={18} /> New Entry
           </button>
        </div>
      </div>

      <div className="flex space-x-1 border-b overflow-x-auto scrollbar-hide bg-gray-50 p-1 rounded-xl">
         {tabs.map(tab => (
           <button key={tab.id} onClick={() => setSearchParams({ tab: tab.id })} className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black transition-all rounded-lg ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'ARTICLES' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-6 py-4">Article</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {articles.map(art => (
                      <tr key={art.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 flex items-center gap-3"><img src={art.thumbnailUrl} className="w-10 h-10 rounded-lg object-cover" /><span className="font-bold">{art.title}</span></td>
                         <td className="px-6 py-4">{art.authorName}</td>
                         <td className="px-6 py-4"><span className={`text-[10px] font-bold ${art.status === 'PUBLISHED' ? 'text-green-600' : 'text-orange-500'}`}>{art.status}</span></td>
                         <td className="px-6 py-4 text-right space-x-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                            <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
      )}

      {activeTab === 'EPAPER' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {epaperPages.map(page => (
              <div key={page.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                 <img src={page.imageUrl} className="aspect-[3/4] object-cover" />
                 <div className="p-3 border-t flex justify-between items-center">
                    <span className="font-bold text-xs">{page.date}</span>
                    <span className="text-[10px] font-black uppercase text-gray-400">P. {page.pageNumber}</span>
                 </div>
              </div>
           ))}
        </div>
      )}

      {activeTab === 'CLASSIFIEDS' && (
         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {classifieds.map(cl => (
                      <tr key={cl.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 font-bold">{cl.title}</td>
                         <td className="px-6 py-4">{cl.location}</td>
                         <td className="px-6 py-4 font-bold text-emerald-600">{cl.price}</td>
                         <td className="px-6 py-4 text-right space-x-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                            <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
      )}

      {activeTab === 'DEVICES' && (
        <div className="space-y-6">
           <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                 <h3 className="text-xl font-bold flex items-center gap-2"><Lock size={20} className="text-[#b4a070]"/> Trusted Device System</h3>
                 <p className="text-indigo-200 text-sm mt-1">Your Primary Device is required to approve all new sign-ins.</p>
              </div>
              {isCurrentlyPrimary && <span className="bg-[#b4a070] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">YOU ARE ON PRIMARY DEVICE</span>}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => (
                 <div key={device.id} className={`p-5 rounded-2xl border-2 transition-all ${device.device_id === getDeviceId() ? 'border-[#b4a070] bg-white shadow-lg' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
                          {device.device_name.includes('Chrome') ? <Monitor size={24}/> : <Phone size={24}/>}
                       </div>
                       {device.is_primary && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PRIMARY</span>}
                    </div>
                    <h4 className="font-bold text-gray-900">{device.device_name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">{device.device_id}</p>
                    <div className="mt-4 flex items-center justify-between">
                       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${device.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {device.status}
                       </span>
                       {device.status === 'PENDING' && isCurrentlyPrimary && (
                          <button 
                            onClick={() => { approveDevice(device.device_id); loadData(); }}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            Approve Now
                          </button>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'COMMUNICATION' && <ChatSystem />}

      {/* CREATE MODALS */}
      {showCreateModal === 'EPAPER' && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-[#111827] p-6 text-white flex justify-between items-center">
                 <h3 className="font-bold text-lg">Add E-Paper Page</h3>
                 <button onClick={() => setShowCreateModal('NONE')}><X /></button>
              </div>
              <form onSubmit={handleAddEpaper} className="p-8 space-y-4">
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Edition Date</label>
                    <input type="date" required value={newEpaper.date} onChange={e => setNewEpaper({...newEpaper, date: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Page Number</label>
                    <input type="number" required value={newEpaper.pageNumber} onChange={e => setNewEpaper({...newEpaper, pageNumber: parseInt(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Image URL</label>
                    <input type="url" value={newEpaper.imageUrl} onChange={e => setNewEpaper({...newEpaper, imageUrl: e.target.value})} placeholder="https://..." className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                 </div>
                 <button type="submit" className="w-full bg-[#111827] text-white font-bold py-4 rounded-xl shadow-lg mt-4">Save Page</button>
              </form>
           </div>
        </div>
      )}

      {showCreateModal === 'CLASSIFIED' && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-[#111827] p-6 text-white flex justify-between items-center">
                 <h3 className="font-bold text-lg">Post Classified</h3>
                 <button onClick={() => setShowCreateModal('NONE')}><X /></button>
              </div>
              <form onSubmit={handleAddClassified} className="p-8 space-y-4">
                 <input placeholder="Listing Title" required value={newClassified.title} onChange={e => setNewClassified({...newClassified, title: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                 <textarea placeholder="Description" required value={newClassified.content} onChange={e => setNewClassified({...newClassified, content: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070] h-32" />
                 <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Price" required value={newClassified.price} onChange={e => setNewClassified({...newClassified, price: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                    <input placeholder="Location" required value={newClassified.location} onChange={e => setNewClassified({...newClassified, location: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-[#b4a070]" />
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-4">Publish Listing</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
