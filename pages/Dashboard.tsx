import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Article, TrustedDevice, SecurityRequest } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Shield, Smartphone, User as UserIcon, Lock, AlertTriangle, X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ChatSystem } from '../modules/communication/ChatSystem';
import { getDeviceId } from '../utils/device';

export const Dashboard: React.FC = () => {
  const { user, isDeviceApproved, isPrimaryDevice, refreshDeviceStatus } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTabParam = searchParams.get('tab') as 'ARTICLES' | 'COMMUNICATION' | 'SECURITY' | null;
  const activeTab = activeTabParam || 'ARTICLES';

  const [loading, setLoading] = useState(true);
  
  // Data States
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [securityRequests, setSecurityRequests] = useState<SecurityRequest[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Forms
  const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
  const [newArticleData, setNewArticleData] = useState({ title: '', summary: '', content: '', category: 'Technology', thumbnailUrl: 'https://picsum.photos/id/1/800/600', isFeatured: false, isTrending: false });
  
  // Profile Edit
  const [profileEditData, setProfileEditData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [isEditProfilePending, setIsEditProfilePending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
        // Load Articles
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          content: a.content,
          authorId: a.author_id,
          authorName: a.author_name,
          authorAvatar: a.author_avatar,
          status: a.status,
          category: a.category,
          thumbnailUrl: a.thumbnail_url,
          isFeatured: a.is_featured,
          isTrending: a.is_trending,
          createdAt: a.created_at
        })));

        if (user) {
          // Load Devices (Limit 5)
          const { data: dev } = await supabase
              .from('trusted_devices')
              .select('*')
              .eq('profile_id', user.id)
              .order('last_active', { ascending: false })
              .limit(5);
          if (dev) setDevices(dev as TrustedDevice[]);

          // Load Security Requests (Only if Primary, otherwise just see own?)
          // Actually, all users can see requests to know status, but only Primary can approve
          const { data: req } = await supabase
              .from('security_requests')
              .select('*')
              .eq('profile_id', user.id)
              .eq('status', 'PENDING')
              .order('created_at', { ascending: false });
          if (req) setSecurityRequests(req as SecurityRequest[]);
          
          setProfileEditData({ name: user.name, email: user.email });
        }
    } catch (e) { console.error("Fetch error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user]);

  // --- Article Handlers ---
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const articlePayload = {
      title: newArticleData.title,
      summary: newArticleData.summary,
      content: newArticleData.content,
      category: newArticleData.category,
      thumbnail_url: newArticleData.thumbnailUrl,
      is_featured: newArticleData.isFeatured,
      is_trending: newArticleData.isTrending,
      author_id: user.id,
      author_name: user.name,
      author_avatar: user.avatar,
      status: 'PUBLISHED'
    };

    const { error } = await supabase.from('articles').insert(articlePayload);
    if (error) alert(error.message);
    else {
      setIsAddArticleModalOpen(false);
      setNewArticleData({ title: '', summary: '', content: '', category: 'Technology', thumbnailUrl: 'https://picsum.photos/id/1/800/600', isFeatured: false, isTrending: false });
      loadData();
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  // --- Security Handlers ---
  const handleApproveRequest = async (request: SecurityRequest, action: 'APPROVE' | 'REJECT') => {
    if (!isPrimaryDevice) {
        alert("Only the Primary Device can approve requests.");
        return;
    }

    if (action === 'REJECT') {
        await supabase.from('security_requests').update({ status: 'REJECTED' }).eq('id', request.id);
        if (request.request_type === 'DEVICE_ADD') {
            await supabase.from('trusted_devices').update({ status: 'BLOCKED' }).eq('device_id', request.details.device_id).eq('profile_id', user?.id);
        }
        loadData();
        return;
    }

    // Action is APPROVE
    try {
        if (request.request_type === 'DEVICE_ADD') {
            await supabase.from('trusted_devices')
                .update({ status: 'APPROVED' })
                .eq('device_id', request.details.device_id)
                .eq('profile_id', user?.id);
        } else if (request.request_type === 'PROFILE_UPDATE') {
            await supabase.from('profiles')
                .update({ 
                    name: request.details.new_name,
                    email: request.details.new_email
                })
                .eq('id', user?.id);
            // Note: If email changed, Supabase auth might need separate handling, but for this mock profile table it works.
        }

        await supabase.from('security_requests').update({ status: 'APPROVED' }).eq('id', request.id);
        alert("Request Approved Successfully");
        loadData();
    } catch (err) {
        console.error(err);
        alert("Failed to process request");
    }
  };

  const handleRequestProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If Primary, do it directly
    if (isPrimaryDevice) {
       const { error } = await supabase.from('profiles')
            .update({ name: profileEditData.name }) // Email update usually requires re-auth flow in Supabase
            .eq('id', user?.id);
       
       if (error) alert("Error updating profile");
       else {
           alert("Profile Updated Successfully");
           loadData();
       }
    } else {
       // Secondary Device -> Create Request
       const { error } = await supabase.from('security_requests').insert({
         profile_id: user?.id,
         request_type: 'PROFILE_UPDATE',
         details: { new_name: profileEditData.name, new_email: profileEditData.email },
         requested_from_device: getDeviceId()
       });
       
       if (error) alert("Error sending request");
       else {
           setIsEditProfilePending(true);
           alert("Update request sent to Primary Device for approval.");
           loadData();
       }
    }
  };

  // --- Render Blocker if Device Not Approved ---
  if (!user) return <div className="p-20 text-center">Access Denied</div>;

  if (!isDeviceApproved) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-yellow-500">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
            <Smartphone size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Approval Required</h2>
          <p className="text-gray-500 mb-6 text-sm">
            This device is <strong>not trusted</strong>. To access the dashboard, you must approve this login from your <strong>Primary Device</strong>.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-xl text-left mb-6 text-xs border border-gray-100">
            <div className="flex justify-between mb-2">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Device ID</span>
                <span className="font-mono text-gray-700">{getDeviceId().slice(0,8)}...</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Status</span>
                <span className="text-orange-600 font-bold bg-orange-50 px-2 rounded">PENDING APPROVAL</span>
            </div>
          </div>
          
          <button 
            onClick={refreshDeviceStatus} 
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mb-3"
          >
            Check Approval Status
          </button>
          <p className="text-xs text-gray-400">If you lost your primary device, please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Hello, {user.name}. Role: <span className="font-bold uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">{user.role}</span></p>
        </div>
        <div className="flex items-center gap-3">
           {isPrimaryDevice ? (
               <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-green-200 shadow-sm">
                   <Shield size={12}/> PRIMARY DEVICE
               </span>
           ) : (
               <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-gray-200">
                   <Smartphone size={12}/> SECONDARY DEVICE
               </span>
           )}
        </div>
      </div>

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

      {/* --- ARTICLES TAB --- */}
      {activeTab === 'ARTICLES' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Your Published Articles</h3>
            <button 
              onClick={() => setIsAddArticleModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} /> New Article
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Article</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <img src={article.thumbnailUrl} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                            <div className="overflow-hidden">
                               <p className="font-bold text-gray-900 truncate max-w-xs">{article.title}</p>
                               <p className="text-xs text-gray-500 truncate">{article.authorName}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{article.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit3 size={16} /></button>
                          <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No articles found. Create your first one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- COMMUNICATION TAB --- */}
      {activeTab === 'COMMUNICATION' && <ChatSystem />}

      {/* --- SECURITY TAB --- */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
           
           {/* 1. Profile Settings */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon size={20} className="text-indigo-600"/> Profile Security</h3>
              
              {!isPrimaryDevice && (
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100 flex items-start gap-2">
                     <AlertTriangle size={14} className="mt-0.5" />
                     <p>You are logged in on a <strong>Secondary Device</strong>. Changes to your profile must be approved by your Primary Device before they take effect.</p>
                  </div>
              )}

              <form onSubmit={handleRequestProfileUpdate} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                    <input 
                       type="text" 
                       value={profileEditData.name} 
                       onChange={e => setProfileEditData({...profileEditData, name: e.target.value})}
                       className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                    <input 
                       type="email" 
                       value={profileEditData.email} 
                       onChange={e => setProfileEditData({...profileEditData, email: e.target.value})}
                       className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                 </div>
                 <div className="pt-2">
                     <button type="submit" className={`w-full font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 ${isPrimaryDevice ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}>
                        {isPrimaryDevice ? <CheckCircle size={18} /> : <Clock size={18} />}
                        {isPrimaryDevice ? 'Save Changes Immediately' : 'Request Change Approval'}
                     </button>
                 </div>
              </form>
           </div>

           {/* 2. Security Requests & Devices */}
           <div className="space-y-6">
              
              {/* Approvals Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <Lock size={20} className="text-orange-500"/> 
                     Pending Approvals
                     {securityRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{securityRequests.length}</span>}
                 </h3>
                 
                 {securityRequests.length === 0 ? (
                     <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                         No pending security requests.
                     </div>
                 ) : (
                     <div className="space-y-3">
                        {securityRequests.map(req => (
                           <div key={req.id} className="p-4 border border-gray-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 gap-3">
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded uppercase">{req.request_type.replace('_', ' ')}</span>
                                     <span className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-sm text-gray-700">
                                    {req.request_type === 'DEVICE_ADD' ? (
                                        <>Allow login from <strong>{req.details.device_name}</strong>?</>
                                    ) : (
                                        <>Change name to <strong>{req.details.new_name}</strong>?</>
                                    )}
                                 </p>
                              </div>
                              
                              {isPrimaryDevice ? (
                                 <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => handleApproveRequest(req, 'APPROVE')} className="flex-1 sm:flex-none p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex justify-center"><CheckCircle size={18}/></button>
                                    <button onClick={() => handleApproveRequest(req, 'REJECT')} className="flex-1 sm:flex-none p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex justify-center"><XCircle size={18}/></button>
                                 </div>
                              ) : (
                                 <span className="text-[10px] font-bold text-orange-400 bg-white px-2 py-1 rounded border border-orange-100">
                                     WAITING FOR PRIMARY
                                 </span>
                              )}
                           </div>
                        ))}
                     </div>
                 )}
              </div>

              {/* Trusted Devices List */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Smartphone size={20} className="text-green-600"/> Trusted Devices</h3>
                    <span className="text-xs text-gray-400">Max 5</span>
                 </div>
                 
                 <div className="space-y-3">
                    {devices.map(dev => (
                       <div key={dev.id} className={`p-4 border rounded-xl flex items-center justify-between ${dev.is_primary ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${dev.is_primary ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Smartphone size={20} />
                             </div>
                             <div>
                                <p className="text-sm font-bold flex items-center gap-2">
                                   {dev.device_name} 
                                   {dev.device_id === getDeviceId() && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Current</span>}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono">Last active: {new Date(dev.last_active).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {dev.is_primary ? (
                               <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">Primary</span>
                             ) : (
                               <span className={`text-[10px] font-bold uppercase ${dev.status === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`}>{dev.status}</span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Article Modal */}
      {isAddArticleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
              <div className="p-6 border-b flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-800">Publish New Article</h2>
                 <button onClick={() => setIsAddArticleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateArticle} className="flex-1 overflow-y-auto p-8 space-y-6">
                 {/* Form content same as before... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Headline</label>
                          <input 
                             type="text" required
                             value={newArticleData.title}
                             onChange={e => setNewArticleData({...newArticleData, title: e.target.value})}
                             className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Summary</label>
                          <textarea 
                             required
                             value={newArticleData.summary}
                             onChange={e => setNewArticleData({...newArticleData, summary: e.target.value})}
                             className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
                          <select 
                            value={newArticleData.category}
                            onChange={e => setNewArticleData({...newArticleData, category: e.target.value})}
                            className="w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                             <option>Technology</option>
                             <option>Business</option>
                             <option>Culture</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Content Body</label>
                    <RichTextEditor 
                       value={newArticleData.content} 
                       onChange={html => setNewArticleData({...newArticleData, content: html})} 
                       placeholder="Start writing..."
                    />
                 </div>

                 <div className="pt-4 border-t flex justify-end gap-4">
                    <button type="button" onClick={() => setIsAddArticleModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800">Discard</button>
                    <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Publish Article</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};