
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { MOCK_MESSAGES, MOCK_MAILS, MOCK_USERS } from '../../services/mockData';
import { Message, UserRole, Attachment, Mail, User } from '../../types';
import { Send, Paperclip, Image as ImageIcon, File, Hash, Megaphone, Trash2, X, Download, Mail as MailIcon, Inbox, PenSquare, CornerUpLeft, ChevronLeft, Shield, User as UserIcon, Menu, ArrowLeft } from 'lucide-react';

export const ChatSystem: React.FC = () => {
  const { user } = useAuth();
  
  // --- Responsive State ---
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'CHAT' | 'MAIL'>('CHAT');
  
  // --- Chat State ---
  // Default to Announcements for everyone
  const [activeChannel, setActiveChannel] = useState<string>('ANNOUNCEMENTS');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isChatUploading, setIsChatUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // --- Mail State ---
  const [mails, setMails] = useState<Mail[]>([]);
  const [activeMailFolder, setActiveMailFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  
  // Mail Compose State
  const [mailToId, setMailToId] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailAttachments, setMailAttachments] = useState<Attachment[]>([]);
  const [isMailUploading, setIsMailUploading] = useState(false);
  const mailFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // --- Helper Functions ---
  const getDmChannelId = (id1: string, id2: string) => {
    return [id1, id2].sort().join('-');
  };

  const getRecipientUserForChannel = (channelId: string): User | undefined => {
     if(channelId === 'ANNOUNCEMENTS') return undefined;
     const parts = channelId.split('-');
     const otherId = parts.find(id => id !== user?.id);
     return MOCK_USERS.find(u => u.id === otherId);
  };

  // --- Initialization & Simulation ---
  useEffect(() => {
    const loadData = () => {
      try {
          // Load Chat
          const storedMessages = localStorage.getItem('newsflow_chat_messages');
          if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
          } else {
            setMessages(MOCK_MESSAGES);
            localStorage.setItem('newsflow_chat_messages', JSON.stringify(MOCK_MESSAGES));
          }

          // Load Mail
          const storedMails = localStorage.getItem('newsflow_mails');
          if (storedMails) {
            setMails(JSON.parse(storedMails));
          } else {
            setMails(MOCK_MAILS);
            localStorage.setItem('newsflow_mails', JSON.stringify(MOCK_MAILS));
          }
      } catch (e) {
          console.error("Error loading chat data", e);
          // Fallback
          setMessages(MOCK_MESSAGES);
          setMails(MOCK_MAILS);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'CHAT' && !showMobileSidebar) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChannel, activeTab, showMobileSidebar]);

  // --- CHAT HANDLERS ---
  const handleSendChatMessage = (attachments: Attachment[] = []) => {
    if ((!chatInputText.trim() && attachments.length === 0) || !user) return;

    // Fix: Adding required property 'isSystem' to the Message object.
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channel: activeChannel,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      senderAvatar: user.avatar,
      content: chatInputText.trim(),
      attachments: attachments,
      createdAt: new Date().toISOString(),
      isSystem: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('newsflow_chat_messages', JSON.stringify(updatedMessages));
    setChatInputText('');
  };

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsChatUploading(true);
    
    // Simulate upload
    setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const attachment: Attachment = {
                id: `att-${Date.now()}`,
                type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
                url: base64,
                name: file.name
            };
            handleSendChatMessage([attachment]);
            setIsChatUploading(false);
            if (chatFileInputRef.current) chatFileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    }, 1000);
  };

  // --- MAIL HANDLERS ---
  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mailToId || !mailSubject.trim()) return;

    const recipient = MOCK_USERS.find(u => u.id === mailToId);
    if (!recipient) return;

    const newMail: Mail = {
        id: `mail-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        senderEmail: user.email,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        subject: mailSubject,
        content: mailBody,
        attachments: mailAttachments,
        createdAt: new Date().toISOString(),
        isRead: false
    };

    const updatedMails = [newMail, ...mails];
    setMails(updatedMails);
    localStorage.setItem('newsflow_mails', JSON.stringify(updatedMails));

    // Reset Form
    setIsComposing(false);
    setMailToId('');
    setMailSubject('');
    setMailBody('');
    setMailAttachments([]);
    setActiveMailFolder('SENT');
  };

  const handleMailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     setIsMailUploading(true);

     setTimeout(() => {
         const reader = new FileReader();
         reader.onloadend = () => {
             const base64 = reader.result as string;
             const att: Attachment = {
                 id: `att-${Date.now()}`,
                 type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
                 url: base64,
                 name: file.name
             };
             setMailAttachments([...mailAttachments, att]);
             setIsMailUploading(false);
             if (mailFileInputRef.current) mailFileInputRef.current.value = '';
         };
         reader.readAsDataURL(file);
     }, 1000);
  };

  const handleReadMail = (mail: Mail) => {
     setSelectedMail(mail);
     // Mark as read if receiving
     if (mail.recipientId === user?.id && !mail.isRead) {
         const updated = mails.map(m => m.id === mail.id ? {...m, isRead: true} : m);
         setMails(updated);
         localStorage.setItem('newsflow_mails', JSON.stringify(updated));
     }
  };

  const handleReply = () => {
     if (!selectedMail || !user) return;
     const replyToId = selectedMail.senderId === user.id ? selectedMail.recipientId : selectedMail.senderId;
     
     setIsComposing(true);
     setMailToId(replyToId);
     setMailSubject(`Re: ${selectedMail.subject}`);
     setMailBody(`\n\n--- Original Message ---\nFrom: ${selectedMail.senderName}\nSent: ${new Date(selectedMail.createdAt).toLocaleString()}\n\n${selectedMail.content}`);
     setSelectedMail(null);
  };

  // --- RENDER HELPERS ---
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Filter Data
  const filteredMessages = messages.filter(m => m.channel === activeChannel);
  
  const inboxMails = mails.filter(m => m.recipientId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sentMails = mails.filter(m => m.senderId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const displayedMails = activeMailFolder === 'INBOX' ? inboxMails : sentMails;
  const unreadCount = inboxMails.filter(m => !m.isRead).length;

  const canChatPost = activeChannel !== 'ANNOUNCEMENTS' || isAdmin;
  const channelRecipient = getRecipientUserForChannel(activeChannel);

  // Users available for Chat and Mail
  // Admin sees everyone. Staff only sees Admins.
  const availableRecipients = isAdmin 
      ? MOCK_USERS.filter(u => u.id !== user?.id)
      : MOCK_USERS.filter(u => u.role === UserRole.ADMIN);

  // --- NAVIGATION ACTIONS (Mobile) ---
  const handleMobileNav = (action: () => void) => {
      action();
      setShowMobileSidebar(false); // Hide sidebar on mobile after selection
  };

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300 relative">
      
      {/* --- SIDEBAR --- */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-gray-50 border-r border-gray-200 flex-col absolute md:relative inset-0 z-20`}>
        <div className="p-4 border-b border-gray-200 bg-gray-100 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-gray-700 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               Comm Hub
             </h3>
             <p className="text-xs text-gray-500 mt-1">Staff Communication</p>
           </div>
           {/* Mobile Only Close */}
           {!showMobileSidebar && (
              <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-1 text-gray-500">
                  <X size={20} />
              </button>
           )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
           {/* LIVE CHAT SECTION */}
           <div>
               <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Hash size={12} /> Live Channels
               </div>
               <div className="space-y-1">
                   {/* Announcements Channel - Always Visible */}
                   <button 
                     onClick={() => handleMobileNav(() => { setActiveTab('CHAT'); setActiveChannel('ANNOUNCEMENTS'); })}
                     className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'CHAT' && activeChannel === 'ANNOUNCEMENTS' ? 'bg-orange-100 text-orange-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                   >
                     <Megaphone size={18} /> Announcements
                   </button>
                   
                   {/* Divider */}
                   <div className="my-2 border-t border-gray-200 mx-2"></div>
                   
                   {/* Direct Messages List */}
                   {availableRecipients.map(recipient => {
                       const channelId = user ? getDmChannelId(user.id, recipient.id) : '';
                       const isActive = activeTab === 'CHAT' && activeChannel === channelId;
                       return (
                           <button 
                                key={recipient.id}
                                onClick={() => handleMobileNav(() => { setActiveTab('CHAT'); setActiveChannel(channelId); })}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                           >
                                <div className="relative flex-shrink-0">
                                    <img src={recipient.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                                </div>
                                <span className="truncate text-left">{isAdmin ? recipient.name : `Admin Support`}</span>
                           </button>
                       );
                   })}
                   
                   {availableRecipients.length === 0 && !isAdmin && (
                       <div className="px-3 py-2 text-xs text-gray-400 italic">No admins online.</div>
                   )}
               </div>
           </div>

           {/* INTERNAL MAIL SECTION */}
           <div>
               <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <MailIcon size={12} /> Internal Mail
               </div>
               <div className="space-y-1">
                   <button 
                     onClick={() => handleMobileNav(() => { setActiveTab('MAIL'); setIsComposing(true); setSelectedMail(null); })}
                     className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-indigo-600 hover:bg-indigo-50 font-medium mb-2"
                   >
                     <PenSquare size={18} /> Compose
                   </button>

                   <button 
                     onClick={() => handleMobileNav(() => { setActiveTab('MAIL'); setActiveMailFolder('INBOX'); setIsComposing(false); setSelectedMail(null); })}
                     className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'MAIL' && activeMailFolder === 'INBOX' && !isComposing ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                   >
                     <Inbox size={18} /> Inbox
                     {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                     )}
                   </button>

                   <button 
                     onClick={() => handleMobileNav(() => { setActiveTab('MAIL'); setActiveMailFolder('SENT'); setIsComposing(false); setSelectedMail(null); })}
                     className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'MAIL' && activeMailFolder === 'SENT' && !isComposing ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                   >
                     <Send size={18} /> Sent
                   </button>
               </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
           {user && (
            <div className="flex items-center gap-2">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
            </div>
           )}
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white w-full`}>
        
        {/* === MODE: CHAT === */}
        {activeTab === 'CHAT' && (
           <>
            {/* Chat Header */}
            <div className="h-14 border-b border-gray-200 flex items-center px-4 md:px-6 justify-between bg-white shadow-sm z-10">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setShowMobileSidebar(true)} className="md:hidden text-gray-500 mr-1">
                        <ArrowLeft size={24} />
                    </button>

                    {activeChannel === 'ANNOUNCEMENTS' ? (
                        <>
                            <Megaphone className="text-orange-500 flex-shrink-0" size={20} />
                            <div className="overflow-hidden">
                                <h2 className="font-bold text-gray-800 truncate">Announcements</h2>
                                <p className="text-xs text-gray-500 truncate">Public Broadcast Channel</p>
                            </div>
                        </>
                    ) : (
                        <>
                             {channelRecipient?.avatar ? (
                                 <img src={channelRecipient.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                             ) : (
                                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0"><UserIcon size={16} /></div>
                             )}
                             <div className="overflow-hidden">
                                <h2 className="font-bold text-gray-800 truncate">{channelRecipient?.name || 'Unknown User'}</h2>
                                <p className="text-xs text-gray-500 truncate">{channelRecipient?.role}</p>
                             </div>
                        </>
                    )}
                </div>
                {activeChannel === 'ANNOUNCEMENTS' && !isAdmin && (
                    <span className="text-[10px] md:text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1 flex-shrink-0">
                        <Shield size={10} /> <span className="hidden sm:inline">Read Only</span>
                    </span>
                )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
               {filteredMessages.length === 0 && (
                 <div className="text-center text-gray-400 py-20">
                   <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Hash size={32} /></div>
                   <p>No messages yet. Start the conversation!</p>
                 </div>
               )}
               {filteredMessages.map((msg, index) => {
                  const isMe = msg.senderId === user?.id;
                  const showDateHeader = index === 0 || formatDate(msg.createdAt) !== formatDate(filteredMessages[index - 1].createdAt);
                  return (
                    <div key={msg.id}>
                      {showDateHeader && <div className="flex justify-center my-4"><span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full uppercase tracking-wider">{formatDate(msg.createdAt)}</span></div>}
                      <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <img src={msg.senderAvatar || 'https://via.placeholder.com/150'} alt={msg.senderName} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white shadow-sm flex-shrink-0" />
                          <div className={`max-w-[75%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]">{msg.senderName}</span>
                                 <span className="text-[10px] text-gray-500">{formatTime(msg.createdAt)}</span>
                              </div>
                              <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : activeChannel === 'ANNOUNCEMENTS' ? 'bg-orange-50 border border-orange-100 text-gray-800 rounded-tl-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                  {msg.content}
                              </div>
                              {msg.attachments && msg.attachments.length > 0 && (
                                 <div className="mt-2 space-y-2 w-full">
                                    {msg.attachments.map((att) => (
                                       <div key={att.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                          {att.type === 'IMAGE' ? (
                                             <div className="relative group">
                                                <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover" />
                                                <a href={att.url} download={att.name} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Download size={24} /></a>
                                             </div>
                                          ) : (
                                             <div className="flex items-center gap-3 p-3 min-w-[150px]">
                                                <File size={24} className="text-indigo-500 flex-shrink-0" />
                                                <div className="overflow-hidden flex-1"><p className="text-xs font-bold truncate">{att.name}</p></div>
                                                <a href={att.url} download={att.name} className="text-gray-400 hover:text-indigo-600"><Download size={16} /></a>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}
                          </div>
                      </div>
                    </div>
                  );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 md:p-4 bg-white border-t border-gray-200">
               {canChatPost ? (
                 <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
                    <input type="file" ref={chatFileInputRef} className="hidden" onChange={handleChatFileUpload} accept="image/*,application/pdf" />
                    <button onClick={() => chatFileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0" disabled={isChatUploading}>
                       {isChatUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Paperclip size={20} />}
                    </button>
                    <textarea value={chatInputText} onChange={e => setChatInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); } }} placeholder={activeChannel === 'ANNOUNCEMENTS' ? "Post..." : "Message..."} className="flex-1 bg-transparent border-none outline-none text-sm resize-none py-2 max-h-32 min-h-[40px]" rows={1} />
                    <button onClick={() => handleSendChatMessage()} disabled={!chatInputText.trim() && !isChatUploading} className={`p-2 rounded-lg transition-all flex-shrink-0 ${chatInputText.trim() ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Send size={18} /></button>
                 </div>
               ) : (
                 <div className="text-center text-gray-400 text-sm py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center gap-2">
                     <Shield size={14} /> Only Admins can post.
                 </div>
               )}
            </div>
           </>
        )}

        {/* === MODE: MAIL === */}
        {activeTab === 'MAIL' && (
           <div className="flex flex-col h-full bg-white">
               
               {/* 1. COMPOSE VIEW */}
               {isComposing && (
                  <div className="flex flex-col h-full p-4 md:p-6 animate-in slide-in-from-right duration-200">
                     <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div className="flex items-center gap-2">
                           <button onClick={() => setShowMobileSidebar(true)} className="md:hidden text-gray-500 mr-2">
                              <ArrowLeft size={24} />
                           </button>
                           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <PenSquare size={24} className="text-indigo-600" /> Compose
                           </h2>
                        </div>
                        <button onClick={() => setIsComposing(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                     </div>
                     <form onSubmit={handleSendMail} className="flex-1 flex flex-col gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                           <select 
                              required 
                              value={mailToId}
                              onChange={e => setMailToId(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                           >
                              <option value="">Select Recipient</option>
                              {/* Filter recipients: Admin can see all, Staff can ONLY see Admin */}
                              {availableRecipients.map(u => (
                                 <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                           <input 
                              type="text" required
                              value={mailSubject}
                              onChange={e => setMailSubject(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter subject..."
                           />
                        </div>
                        <div className="flex-1 flex flex-col">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                           <textarea 
                              required
                              value={mailBody}
                              onChange={e => setMailBody(e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              placeholder="Type your email content here..."
                           />
                        </div>

                        {/* Attachments Section */}
                        {mailAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {mailAttachments.map(att => (
                                    <div key={att.id} className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                        <Paperclip size={12} /> <span className="truncate max-w-[100px]">{att.name}</span>
                                        <button type="button" onClick={() => setMailAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t">
                           <div className="flex items-center gap-2">
                              <input type="file" ref={mailFileInputRef} className="hidden" onChange={handleMailFileUpload} />
                              <button type="button" onClick={() => mailFileInputRef.current?.click()} className="text-gray-500 hover:text-indigo-600 flex items-center gap-1 text-sm px-3 py-2 rounded hover:bg-gray-100" disabled={isMailUploading}>
                                 <Paperclip size={18} /> <span className="hidden sm:inline">Attach File</span> {isMailUploading && '...'}
                              </button>
                           </div>
                           <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                              <Send size={18} /> Send
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {/* 2. READ VIEW */}
               {!isComposing && selectedMail && (
                   <div className="flex flex-col h-full animate-in slide-in-from-right duration-200">
                       <div className="h-14 border-b border-gray-200 flex items-center px-4 justify-between bg-white">
                           <button onClick={() => setSelectedMail(null)} className="flex items-center text-gray-500 hover:text-gray-800 gap-1 font-medium">
                              <ChevronLeft size={20} /> Back
                           </button>
                           <div className="flex gap-2">
                              <button onClick={() => {/* Delete logic */}} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                           </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-6">
                           <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{selectedMail.subject}</h1>
                           <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                              <div className="flex gap-3">
                                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                                     {selectedMail.senderName.charAt(0)}
                                 </div>
                                 <div className="overflow-hidden">
                                     <div className="font-bold text-gray-800 truncate">{selectedMail.senderName}</div>
                                     <div className="text-xs text-gray-500 truncate">{selectedMail.senderEmail}</div>
                                 </div>
                              </div>
                              <div className="text-xs md:text-sm text-gray-500 flex-shrink-0 ml-2">{new Date(selectedMail.createdAt).toLocaleDateString()}</div>
                           </div>
                           
                           <div className="prose max-w-none text-gray-800 mb-8 whitespace-pre-wrap text-sm md:text-base">
                               {selectedMail.content}
                           </div>

                           {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                               <div className="border-t pt-4">
                                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attachments ({selectedMail.attachments.length})</h4>
                                   <div className="flex flex-wrap gap-4">
                                       {selectedMail.attachments.map(att => (
                                           <a key={att.id} href={att.url} download={att.name} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group w-full md:w-auto">
                                               {att.type === 'IMAGE' ? <ImageIcon size={20} className="text-purple-500 flex-shrink-0" /> : <File size={20} className="text-blue-500 flex-shrink-0" />}
                                               <span className="text-sm font-medium text-gray-700 truncate">{att.name}</span>
                                               <Download size={16} className="text-gray-400 group-hover:text-indigo-600 ml-2 flex-shrink-0" />
                                           </a>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                       <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                           <button onClick={handleReply} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                               <CornerUpLeft size={18} /> Reply
                           </button>
                       </div>
                   </div>
               )}

               {/* 3. LIST VIEW (Inbox/Sent) */}
               {!isComposing && !selectedMail && (
                   <div className="flex flex-col h-full animate-in fade-in duration-200">
                       <div className="h-14 border-b border-gray-200 flex items-center px-4 md:px-6 justify-between bg-white">
                           <div className="flex items-center gap-2">
                                <button onClick={() => setShowMobileSidebar(true)} className="md:hidden text-gray-500 mr-2">
                                    <ArrowLeft size={24} />
                                </button>
                               <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                   {activeMailFolder === 'INBOX' ? <><Inbox size={20} /> Inbox</> : <><Send size={20} /> Sent</>}
                               </h2>
                           </div>
                           <span className="text-xs text-gray-500">{displayedMails.length} messages</span>
                       </div>
                       <div className="flex-1 overflow-y-auto">
                           {displayedMails.length === 0 ? (
                               <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                   <div className="bg-gray-100 p-4 rounded-full mb-3"><MailIcon size={32} /></div>
                                   <p>No mail found in {activeMailFolder.toLowerCase()}.</p>
                               </div>
                           ) : (
                               <div className="divide-y divide-gray-100">
                                   {displayedMails.map(mail => (
                                       <div 
                                         key={mail.id} 
                                         onClick={() => handleReadMail(mail)}
                                         className={`flex items-center px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!mail.isRead && activeMailFolder === 'INBOX' ? 'bg-indigo-50/40' : ''}`}
                                       >
                                           <div className={`w-2 h-2 rounded-full mr-3 md:mr-4 flex-shrink-0 ${!mail.isRead && activeMailFolder === 'INBOX' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                                           <div className="flex-1 min-w-0">
                                               <div className="flex justify-between items-baseline mb-1">
                                                   <span className={`text-sm truncate mr-2 ${!mail.isRead && activeMailFolder === 'INBOX' ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                       {activeMailFolder === 'INBOX' ? mail.senderName : `To: ${mail.recipientName}`}
                                                   </span>
                                                   <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{formatDate(mail.createdAt)}</span>
                                               </div>
                                               <h4 className={`text-sm truncate mb-0.5 ${!mail.isRead && activeMailFolder === 'INBOX' ? 'font-bold text-gray-900' : 'text-gray-800'}`}>
                                                   {mail.subject}
                                               </h4>
                                               <p className="text-xs text-gray-500 truncate">{mail.content}</p>
                                           </div>
                                           {mail.attachments && mail.attachments.length > 0 && (
                                               <Paperclip size={14} className="text-gray-400 ml-2 flex-shrink-0" />
                                           )}
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
               )}
           </div>
        )}

      </div>
    </div>
  );
};
