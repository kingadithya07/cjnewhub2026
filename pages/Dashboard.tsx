
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, EPaperPage, Classified, Device } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  FileText, Scissors, Layout, Save, X, Star, Settings, MessageCircle, 
  Shield, Smartphone, AlertTriangle, User as UserIcon, Database, Check, 
  Newspaper, Store, Calendar, Image as ImageIcon, Monitor, Lock, ArrowRight, Loader2, Key, Copy, RefreshCw, Radio
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_EPAPER, MOCK_CLASSIFIEDS } from '../services/mockData';
import { ChatSystem } from '../modules/communication/ChatSystem';
import { getDeviceId } from '../utils/device';

export const Dashboard: React.FC = () => {
  const { user, isDeviceApproved, approveDevice, revokeDevice, approveResetRequest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  
  // Pending Reset Logic
  const [pendingResetCode, setPendingResetCode] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<'NONE' | 'PENDING' | 'APPROVED'>('NONE');

  const [showCreateModal, setShowCreateModal] = useState<'NONE' | 'ARTICLE' | 'EPAPER' | 'CLASSIFIED'>('NONE');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        setArticles(art && art.length > 0 ? art.map(a => ({
            ...a, 
            createdAt: a.created_at || new Date().toISOString(), 
            authorName: a.author_name || 'System', 
            thumbnailUrl: a.thumbnail_url || 'https://picsum.photos/400/300'
        })) : MOCK_ARTICLES);

        const { data: ep } = await supabase.from('epaper_pages').select('*').order('date', { ascending: false });
        setEpaperPages(ep && ep.length > 0 ? ep.map(p => ({
            ...p, 
            pageNumber: p.page_number || 1, 
            imageUrl: p.image_url || 'https://picsum.photos/1200/1800'
        })) : MOCK_EPAPER);

        const { data: cls } = await supabase.from('classifieds').select('*').order('created_at', { ascending: false });
        setClassifieds(cls && cls.length > 0 ? cls.map(c => ({
            ...c, 
            createdAt: c.created_at || new Date().toISOString()
        })) : MOCK_CLASSIFIEDS);

        // Security Data Load
        await refreshSecurityData();

    } catch (e) {
        setArticles(MOCK_ARTICLES);
        setEpaperPages(MOCK_EPAPER);
        setClassifieds(MOCK_CLASSIFIEDS);
    } finally { 
        setLoading(false); 
    }
  };

  const refreshSecurityData = async () => {
    if (!user) return;
    const { data: dev } = await supabase.from('user_devices').select('*').eq('profile_id', user.id);
    setDevices(dev || []);

    const { data: prof } = await supabase.from('profiles').select('reset_approval_status, verification_code').eq('id', user.id).maybeSingle();
    
    if (prof) {
        setResetStatus(prof.reset_approval_status as any);
        // Only set code if it exists, otherwise keep it null but DONT hide the UI
        if (prof.verification_code) {
            setPendingResetCode(prof.verification_code);
        } else {
            setPendingResetCode(null);
        }
    }
  };

  useEffect(() => { loadData(); }, [user]);

  // Realtime Subscription for Security Updates (Push instead of Poll)
  useEffect(() => {
    if (!user) return;

    // Listen for changes to MY profile (Reset Requests)
    const profileChannel = supabase.channel('dashboard_profile_sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
            console.log('Profile update detected - Refreshing Security');
            refreshSecurityData();
        }
      )
      .subscribe();

    // Listen for changes to MY devices (Device Requests)
    const deviceChannel = supabase.channel('dashboard_device_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_devices', filter: `profile_id=eq.${user.id}` },
        () => {
            console.log('Device update detected - Refreshing Security');
            refreshSecurityData();
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(deviceChannel);
    };
  }, [user]);

  const handleApproveReset = async () => {
      if (!user) return;
      await approveResetRequest(user.id);
      // Realtime listener will catch the update and refresh UI
      // Force refresh manually just in case
      setTimeout(refreshSecurityData, 500);
  };

  if (!user) return <div className="p-20 text-center font-black text-gray-400 uppercase tracking-widest">Access Denied</div>;

  const tabs = [
    { id: 'ARTICLES', label: 'ARTICLES', icon: <FileText size={16}/> },
    { id: 'EPAPER', label: 'E-PAPER', icon: <Newspaper size={16}/> },
    { id: 'CLASSIFIEDS', label: 'CLASSIFIEDS', icon: <Store size={16}/> },
    { id: 'DEVICES', label: 'SECURITY', icon: <Shield size={16}/> },
    { id: 'COMMUNICATION', label: 'CHATS', icon: <MessageCircle size={16}/> },
  ];

  const primaryDevice = (devices || []).find(d => d.is_primary);
  const isCurrentlyPrimary = primaryDevice?.device_id === getDeviceId();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase font-serif tracking-tight">Hub <span className="text-[#b4a070]">Console</span></h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> {user.name} • {user.role}
          </p>
        </div>
        <button onClick={() => setShowCreateModal('ARTICLE')} className="bg-[#111827] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg">
            <Plus size={18} className="text-[#b4a070]" /> New Entry
        </button>
      </div>

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
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Syncing Hub...</p>
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
                                <td className="px-6 py-5 text-right">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'DEVICES' && (
                <div className="space-y-8">
                
                {/* PRIMARY DEVICE INDICATOR */}
                <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-between items-center ${isCurrentlyPrimary ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="flex items-center gap-2">
                        {isCurrentlyPrimary ? <CheckCircle size={16} className="text-[#b4a070]" /> : <XCircle size={16} />}
                        {isCurrentlyPrimary ? 'THIS IS THE PRIMARY HUB' : 'THIS IS A SECONDARY VIEWER'}
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="opacity-50 text-[9px]">ID: {getDeviceId().substring(0, 8)}...</span>
                        <button onClick={refreshSecurityData} className="flex items-center gap-1 hover:text-[#b4a070]"><RefreshCw size={12} /> Sync Requests</button>
                    </div>
                </div>

                {/* Reset Approval Section - Logic Relaxed to Show Even if Code is Hidden */}
                {(resetStatus === 'PENDING' || resetStatus === 'APPROVED') && (
                    <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl animate-in zoom-in-95">
                        <div className="flex items-center gap-5">
                            <div className="bg-orange-100 p-4 rounded-3xl text-orange-600"><Key size={32} /></div>
                            <div>
                                <h4 className="font-black text-gray-900 uppercase text-xs tracking-[0.2em]">Password Reset Request</h4>
                                <p className="text-gray-500 text-sm mt-1">
                                    {resetStatus === 'PENDING' ? 'A secondary device requested a reset. Approve to see the code.' : 'Request Approved. The code is visible below.'}
                                </p>
                                {!isCurrentlyPrimary && (
                                    <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide">Action Required on Primary Device</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {resetStatus === 'APPROVED' ? (
                                <div className="flex-1 md:flex-none bg-white border-2 border-orange-100 px-8 py-4 rounded-2xl font-black text-2xl tracking-[0.3em] text-orange-600 text-center shadow-sm min-w-[150px]">
                                    {pendingResetCode || '******'}
                                </div>
                            ) : (
                                isCurrentlyPrimary ? (
                                    <button onClick={handleApproveReset} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all flex items-center gap-2">
                                        <CheckCircle size={16} /> APPROVE REQUEST
                                    </button>
                                ) : (
                                    <div className="bg-gray-200 text-gray-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                        Wait for Primary
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map(device => {
                        const isThisDevice = device.device_id === getDeviceId();
                        return (
                            <div key={device.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${isThisDevice ? 'border-[#b4a070] bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-3xl ${isThisDevice ? 'bg-[#b4a070]/10 text-[#b4a070]' : 'bg-white text-gray-400 shadow-sm'}`}>
                                        {device.device_name?.includes('Chrome') ? <Monitor size={32}/> : <Smartphone size={32}/>}
                                    </div>
                                    {device.is_primary && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl uppercase tracking-widest border border-indigo-100">PRIMARY HUB</span>}
                                </div>
                                <h4 className="font-black text-gray-900 text-xl tracking-tight">{device.device_name || 'Generic Device'}</h4>
                                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">Last Sync: {new Date(device.last_used_at).toLocaleDateString()}</p>
                                
                                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest ${device.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                        {device.status}
                                    </span>
                                    {device.status === 'PENDING' && isCurrentlyPrimary && (
                                        <button onClick={() => { approveDevice(device.device_id); loadData(); }} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Verify Device</button>
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

      {showCreateModal !== 'NONE' && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400"><Database size={40} /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Archives Offline</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">The cloud creation system is currently undergoing security maintenance. Please use the dashboard for monitoring existing records.</p>
              <button onClick={() => setShowCreateModal('NONE')} className="w-full bg-[#111827] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black">Acknowledge</button>
           </div>
        </div>
      )}
    </div>
  );
};
