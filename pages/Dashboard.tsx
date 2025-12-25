import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, Advertisement, EPaperPage, WatermarkSettings, Classified } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, Power, 
  Save, X, Star, Settings, MessageCircle, Shield, Smartphone, AlertTriangle, User as UserIcon
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
  const [devices, setDevices] = useState<any[]>([]);
  const [securityRequests, setSecurityRequests] = useState<any[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);

  // Modals/Forms
  const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
  const [newArticleData, setNewArticleData] = useState({ title: '', summary: '', content: '', category: '', thumbnailUrl: '', isFeatured: false });
  const [profileEditData, setProfileEditData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [isEditProfilePending, setIsEditProfilePending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})));

        if (user) {
          const { data: dev } = await supabase.from('trusted_devices').select('*').eq('profile_id', user.id);
          if (dev) setDevices(dev);

          const { data: req } = await supabase.from('security_requests').select('*').eq('profile_id', user.id).eq('status', 'PENDING');
          if (req) setSecurityRequests(req);
        }
    } catch (e) { console.error("Fetch error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user]);

  const isPrimaryDevice = devices.find(d => d.device_id === getDeviceId())?.is_primary;

  const handleApproveRequest = async (request: any) => {
    if (!isPrimaryDevice) return alert("Only the Primary Device can approve requests.");

    if (request.request_type === 'DEVICE_ADD') {
      await supabase.from('trusted_devices').update({ status: 'APPROVED' }).eq('device_id', request.details.device_id).eq('profile_id', user?.id);
    } else if (request.request_type === 'PROFILE_UPDATE') {
      await supabase.from('profiles').update({ name: request.details.new_name }).eq('id', user?.id);
    } else if (request.request_type === 'EMAIL_CHANGE') {
      // Supabase email changes usually require verification, but we update our profile table
      await supabase.from('profiles').update({ email: request.details.new_email }).eq('id', user?.id);
    }

    await supabase.from('security_requests').update({ status: 'APPROVED' }).eq('id', request.id);
    loadData();
  };

  const handleRequestProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrimaryDevice) {
       // Primary device can update directly
       await supabase.from('profiles').update({ name: profileEditData.name }).eq('id', user?.id);
       alert("Profile Updated Successfully");
    } else {
       // Secondary device needs approval
       await supabase.from('security_requests').insert({
         profile_id: user?.id,
         request_type: 'PROFILE_UPDATE',
         details: { new_name: profileEditData.name },
         requested_from_device: getDeviceId()
       });
       setIsEditProfilePending(true);
       alert("Update request sent to Primary Device for approval.");
    }
  };

  if (!user) return <div className="p-20 text-center">Access Denied</div>;

  // If device is not approved, show a "Waiting for Approval" screen
  if (!isDeviceApproved) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-yellow-500">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
            <Smartphone size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Approval Required</h2>
          <p className="text-gray-500 mb-6">
            This looks like a new device. For your security, please approve this device from your <strong>Primary Device</strong>.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left mb-6 text-sm">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Current Device</p>
            <p className="font-mono text-gray-700">{getDeviceId()}</p>
          </div>
          <button 
            onClick={refreshDeviceStatus} 
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            Check Approval Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
          <p className="text-gray-500 mt-1">Logged in as {user.name} ({user.role})</p>
        </div>
        <div className="flex gap-2">
           {isPrimaryDevice && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-green-200"><Shield size={12}/> PRIMARY DEVICE</span>}
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address (Requires Approval)</label>
                    <input type="email" disabled value={profileEditData.email} className="w-full border p-3 rounded-xl bg-gray-50" />
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md">
                    {isPrimaryDevice ? 'Update Profile' : 'Request Profile Update'}
                 </button>
              </form>
           </div>

           {/* Trusted Devices & Pending Approvals */}
           <div className="space-y-6">
              {/* Approval Requests (Visible mainly to Primary) */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={20} className="text-orange-500"/> Pending Approvals</h3>
                 {!isPrimaryDevice && <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-sm mb-4">Requests must be approved from your <strong>Primary Device</strong>.</div>}
                 
                 <div className="space-y-3">
                    {securityRequests.map(req => (
                       <div key={req.id} className="p-4 border rounded-xl flex justify-between items-center bg-gray-50">
                          <div>
                             <p className="text-sm font-bold text-gray-800">{req.request_type.replace('_', ' ')}</p>
                             <p className="text-xs text-gray-500">
                                {req.request_type === 'DEVICE_ADD' ? `Device: ${req.details.device_name}` : `New Name: ${req.details.new_name}`}
                             </p>
                          </div>
                          {isPrimaryDevice && (
                             <div className="flex gap-2">
                                <button onClick={() => handleApproveRequest(req)} className="p-2 bg-green-500 text-white rounded-lg"><CheckCircle size={16}/></button>
                                <button className="p-2 bg-red-500 text-white rounded-lg"><XCircle size={16}/></button>
                             </div>
                          )}
                       </div>
                    ))}
                    {securityRequests.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No pending requests.</p>}
                 </div>
              </div>

              {/* Device List */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Smartphone size={20} className="text-green-600"/> Trusted Devices</h3>
                 <div className="space-y-3">
                    {devices.map(dev => (
                       <div key={dev.id} className="p-4 border rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${dev.is_primary ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Smartphone size={20} />
                             </div>
                             <div>
                                <p className="text-sm font-bold flex items-center gap-2">
                                   {dev.device_name} 
                                   {dev.device_id === getDeviceId() && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">This Device</span>}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono">{dev.device_id.slice(0, 8)}...</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {dev.is_primary ? (
                               <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Primary</span>
                             ) : (
                               <span className={`text-[10px] font-bold uppercase tracking-tighter ${dev.status === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`}>{dev.status}</span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Content: ARTICLES */}
      {activeTab === 'ARTICLES' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
           {/* ... existing article table logic ... */}
        </div>
      )}

      {/* Content: COMMUNICATION */}
      {activeTab === 'COMMUNICATION' && <ChatSystem />}
    </div>
  );
};