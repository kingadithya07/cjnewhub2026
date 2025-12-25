
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { MOCK_ARTICLES, MOCK_ADS, MOCK_EPAPER, MOCK_SETTINGS, MOCK_CATEGORIES, MOCK_TAGS, MOCK_CLASSIFIEDS, MOCK_USERS, MOCK_MESSAGES, MOCK_MAILS } from '../services/mockData';
import { supabase } from '../services/supabaseClient';
import { UserRole, Article, Advertisement, EPaperPage, WatermarkSettings, Category, Tag, Classified } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, ExternalLink, Power, Image as ImageIcon,
  Save, X, Star, Settings, Type, Tags as TagIcon, FolderTree, Hash, Store, MapPin, DollarSign, MessageCircle, Lock, Database
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { ChatSystem } from '../modules/communication/ChatSystem';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Driven State
  const activeTabParam = searchParams.get('tab') as 'ARTICLES' | 'ADS' | 'EPAPER' | 'SETTINGS' | 'TAXONOMY' | 'CLASSIFIEDS' | 'COMMUNICATION' | null;
  const activeTab = activeTabParam || 'ARTICLES';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [pages, setPages] = useState<EPaperPage[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES); 
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(MOCK_SETTINGS.watermark);

  // Modals
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
  const [isAddAdModalOpen, setIsAddAdModalOpen] = useState(false);
  const [isAddClassifiedModalOpen, setIsAddClassifiedModalOpen] = useState(false);

  // Form States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'ARTICLE' | 'CLASSIFIED'>('ARTICLE');
  const [newTagName, setNewTagName] = useState('');

  // Form States - Others
  const [newPageData, setNewPageData] = useState({ imageUrl: '', pageNumber: '', date: new Date().toISOString().split('T')[0] });
  const [newArticleData, setNewArticleData] = useState({ title: '', summary: '', content: '', category: '', thumbnailUrl: '', isFeatured: false });
  const [newAdData, setNewAdData] = useState({ clientName: '', imageUrl: '', link: '', placement: 'SIDEBAR' as Advertisement['placement'] });
  const [newClassifiedData, setNewClassifiedData] = useState({ title: '', content: '', location: '', price: '', contact: '', category: '' });

  // FETCH DATA FROM SUPABASE
  const loadData = async () => {
    setLoading(true);
    try {
        const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
        if(art) setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url, isFeatured: a.is_featured})));

        const { data: adData } = await supabase.from('ads').select('*');
        if(adData) setAds(adData.map(a => ({...a, clientName: a.client_name, imageUrl: a.image_url})));
        
        const { data: clData } = await supabase.from('classifieds').select('*');
        if(clData) setClassifieds(clData);

        const { data: pData } = await supabase.from('epaper_pages').select('*').order('page_number');
        if(pData) setPages(pData.map(p => ({...p, pageNumber: p.page_number, imageUrl: p.image_url})));

        // Fetch Taxonomy
        const { data: catData } = await supabase.from('categories').select('*');
        if(catData && catData.length > 0) setCategories(catData);

        const { data: tagData } = await supabase.from('tags').select('*');
        if(tagData && tagData.length > 0) setTags(tagData);

    } catch (e) {
        console.error("Fetch error", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // SEED DATA FUNCTION
  const handleSeedDatabase = async () => {
    if(!confirm("This will insert ALL mock data (Users, Articles, Ads, Messages, etc) into the database. Continue?")) return;
    setLoading(true);
    
    try {
        // 1. Profiles
        await supabase.from('profiles').upsert(MOCK_USERS);

        // 2. Categories & Tags
        await supabase.from('categories').upsert(MOCK_CATEGORIES);
        await supabase.from('tags').upsert(MOCK_TAGS);

        // 3. Articles
        const dbArticles = MOCK_ARTICLES.map(a => ({
            id: a.id,
            title: a.title, summary: a.summary, content: a.content, 
            author_id: a.authorId, author_name: a.authorName, author_avatar: a.authorAvatar,
            status: a.status, category: a.category, thumbnail_url: a.thumbnailUrl,
            is_featured: a.isFeatured, is_trending: a.isTrending
        }));
        await supabase.from('articles').upsert(dbArticles);

        // 4. Ads
        const dbAds = MOCK_ADS.map(a => ({
            id: a.id,
            client_name: a.clientName, image_url: a.imageUrl, link: a.link, placement: a.placement, status: a.status
        }));
        await supabase.from('ads').upsert(dbAds);

        // 5. Classifieds
        const dbClassifieds = MOCK_CLASSIFIEDS.map(c => ({
            id: c.id,
            title: c.title, content: c.content, location: c.location, price: c.price, contact: c.contact, category: c.category, status: c.status
        }));
        await supabase.from('classifieds').upsert(dbClassifieds);

        // 6. Epaper
        const dbPages = MOCK_EPAPER.map(p => ({
            id: p.id,
            date: p.date, page_number: p.pageNumber, image_url: p.imageUrl, regions: p.regions
        }));
        await supabase.from('epaper_pages').upsert(dbPages);

        // 7. Messages
        const dbMessages = MOCK_MESSAGES.map(m => ({
            id: m.id,
            channel: m.channel, sender_id: m.senderId, sender_name: m.senderName, sender_role: m.senderRole, sender_avatar: m.senderAvatar,
            content: m.content, created_at: m.createdAt, is_system: m.isSystem
        }));
        await supabase.from('messages').upsert(dbMessages);

        // 8. Mails
        const dbMails = MOCK_MAILS.map(m => ({
            id: m.id,
            sender_id: m.senderId, sender_name: m.senderName, sender_email: m.senderEmail,
            recipient_id: m.recipientId, recipient_name: m.recipientName, recipient_email: m.recipientEmail,
            subject: m.subject, content: m.content, created_at: m.createdAt, is_read: m.isRead
        }));
        await supabase.from('mails').upsert(dbMails);

        alert("Seeding complete! Refreshing...");
        loadData();
    } catch (e) {
        console.error("Seeding Error:", e);
        alert("Error seeding data. Check console.");
    } finally {
        setLoading(false);
    }
  };

  if (!user) return <div>Access Denied</div>;

  const isEditor = user.role === UserRole.EDITOR;
  const isAdmin = user.role === UserRole.ADMIN;
  const isPublisher = user.role === UserRole.PUBLISHER;
  const canManageSystem = isAdmin || isEditor;
  const canDirectlySaveSettings = isAdmin; 
  const displayedArticles = articles;

  // --- Handlers (Supabase Integrated) ---
  const handleArticleDelete = async (id: string) => {
    if(confirm('Delete article?')) {
        await supabase.from('articles').delete().eq('id', id);
        loadData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: Article['status']) => {
    await supabase.from('articles').update({ status: newStatus }).eq('id', id);
    loadData();
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('articles').insert({
        title: newArticleData.title,
        summary: newArticleData.summary,
        content: newArticleData.content || newArticleData.summary,
        author_id: user.id,
        author_name: user.name,
        author_avatar: user.avatar,
        status: 'PUBLISHED', 
        category: newArticleData.category || 'General',
        thumbnail_url: newArticleData.thumbnailUrl || 'https://picsum.photos/id/11/800/600',
        is_featured: newArticleData.isFeatured
    });
    setIsAddArticleModalOpen(false);
    loadData();
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('ads').insert({
        client_name: newAdData.clientName,
        image_url: newAdData.imageUrl,
        link: newAdData.link,
        placement: newAdData.placement,
        status: 'ACTIVE'
    });
    setIsAddAdModalOpen(false);
    loadData();
  };

  const handleAddClassified = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('classifieds').insert({
        ...newClassifiedData,
        status: 'ACTIVE'
    });
    setIsAddClassifiedModalOpen(false);
    loadData();
  };

   const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('epaper_pages').insert({
        image_url: newPageData.imageUrl,
        page_number: parseInt(newPageData.pageNumber),
        date: newPageData.date,
        regions: []
    });
    setIsAddPageModalOpen(false);
    loadData();
  };

  const handleAdDelete = async (id: string) => {
      await supabase.from('ads').delete().eq('id', id);
      loadData();
  };
  
  const handlePageDelete = async (id: string) => {
      await supabase.from('epaper_pages').delete().eq('id', id);
      loadData();
  };

  const handleClassifiedDelete = async (id: string) => {
      await supabase.from('classifieds').delete().eq('id', id);
      loadData();
  };

  const handleSaveSettings = (e: React.FormEvent) => { e.preventDefault(); alert("Saved"); };
  
  const handleAddCategory = async (e: React.FormEvent) => { 
      e.preventDefault();
      await supabase.from('categories').insert({ name: newCategoryName, type: newCategoryType });
      setNewCategoryName('');
      loadData();
  };

  const handleDeleteCategory = async (id: string) => {
      await supabase.from('categories').delete().eq('id', id);
      loadData();
  };

  const handleAddTag = async (e: React.FormEvent) => {
      e.preventDefault();
      await supabase.from('tags').insert({ name: newTagName });
      setNewTagName('');
      loadData();
  };

  const handleDeleteTag = async (id: string) => {
      await supabase.from('tags').delete().eq('id', id);
      loadData();
  };

  const handleAdStatusToggle = async (id: string) => {
      const ad = ads.find(a => a.id === id);
      if(ad) {
          const newStatus = ad.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          await supabase.from('ads').update({ status: newStatus }).eq('id', id);
          loadData();
      }
  };

  const handleClassifiedStatusToggle = async (id: string) => {
      const ad = classifieds.find(c => c.id === id);
      if(ad) {
           const newStatus = ad.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
          await supabase.from('classifieds').update({ status: newStatus }).eq('id', id);
          loadData();
      }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      PUBLISHED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800',
      CLOSED: 'bg-gray-100 text-gray-500',
    };
    // @ts-ignore
    const colorClass = colors[status] || colors.DRAFT;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>{status}</span>;
  };

  if (loading && articles.length === 0 && activeTab === 'ARTICLES') {
      return <div className="p-10 text-center">Loading Dashboard Data...</div>;
  }

  return (
    <div className="space-y-6 relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditor ? 'Editor Dashboard' : isPublisher ? 'Publisher Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
             Welcome back, {user.name}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {activeTab === 'ARTICLES' && (
            <button 
              onClick={() => setIsAddArticleModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
            >
              <Plus size={20} />
              <span>Create Article</span>
            </button>
          )}

          {canManageSystem && activeTab === 'ADS' && (
             <button 
               onClick={() => setIsAddAdModalOpen(true)}
               className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
             >
               <Plus size={20} />
               <span>Create Ad</span>
             </button>
          )}
          
          {canManageSystem && activeTab === 'CLASSIFIEDS' && (
             <button 
               onClick={() => setIsAddClassifiedModalOpen(true)}
               className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
             >
               <Plus size={20} />
               <span>Create Ad</span>
             </button>
          )}
        </div>
      </div>

      {/* Stats Overview - Contextual based on Tab */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-6 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide snap-x items-stretch">
        
        {/* ARTICLES STATS */}
        {activeTab === 'ARTICLES' && (
          <>
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Total Articles</span>
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{displayedArticles.length}</p>
            </div>

            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-yellow-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Pending</span>
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{displayedArticles.filter(a => a.status === 'PENDING').length}</p>
            </div>
            
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-green-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Published</span>
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{displayedArticles.filter(a => a.status === 'PUBLISHED').length}</p>
            </div>
          </>
        )}

        {/* ADS STATS */}
        {activeTab === 'ADS' && (
          <>
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Total Ads</span>
                <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{ads.length}</p>
            </div>
            
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-green-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Active</span>
                <Power className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{ads.filter(a => a.status === 'ACTIVE').length}</p>
            </div>
          </>
        )}
        
        {/* EPAPER STATS */}
        {activeTab === 'EPAPER' && (
           <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Total Pages</span>
              <Scissors className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{pages.length}</p>
          </div>
        )}

        {/* TAXONOMY STATS */}
        {activeTab === 'TAXONOMY' && (
          <>
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Categories</span>
                <FolderTree className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-pink-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Tags</span>
                <TagIcon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{tags.length}</p>
            </div>
          </>
        )}

        {/* CLASSIFIEDS STATS */}
        {activeTab === 'CLASSIFIEDS' && (
           <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Total Ads</span>
                <Store className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{classifieds.length}</p>
            </div>
        )}

        {/* COMMUNICATION STATS */}
        {activeTab === 'COMMUNICATION' && (
           <div className="min-w-[140px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-green-600 mb-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider truncate mr-1">Status</span>
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">Online</p>
            </div>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex space-x-6 border-b overflow-x-auto">
        <button 
          onClick={() => setActiveTab('ARTICLES')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'ARTICLES' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Articles
          {activeTab === 'ARTICLES' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        
        <button 
            onClick={() => setActiveTab('COMMUNICATION')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'COMMUNICATION' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Chat
            {activeTab === 'COMMUNICATION' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        
        {canManageSystem && (
          <>
            <button 
                onClick={() => setActiveTab('CLASSIFIEDS')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'CLASSIFIEDS' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Classifieds
                {activeTab === 'CLASSIFIEDS' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            </button>
             <button 
                onClick={() => setActiveTab('TAXONOMY')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'TAXONOMY' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Taxonomy
                {activeTab === 'TAXONOMY' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('EPAPER')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'EPAPER' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                E-Paper
                {activeTab === 'EPAPER' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('ADS')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'ADS' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Ads
                {activeTab === 'ADS' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'SETTINGS' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Settings
                {activeTab === 'SETTINGS' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            </button>
          </>
        )}
      </div>

      {/* Desktop Header for Current Section */}
      <div className="hidden md:block mb-4">
        <div className="flex space-x-6 border-b">
           <button 
              onClick={() => setActiveTab('ARTICLES')}
              className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'ARTICLES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
              Articles
           </button>
           <button 
              onClick={() => setActiveTab('COMMUNICATION')}
              className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'COMMUNICATION' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
              Communication
           </button>
           
           {canManageSystem && (
             <>
               <button 
                  onClick={() => setActiveTab('CLASSIFIEDS')}
                  className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'CLASSIFIEDS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Classifieds
               </button>
               <button 
                  onClick={() => setActiveTab('TAXONOMY')}
                  className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'TAXONOMY' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Taxonomy
               </button>
               <button 
                  onClick={() => setActiveTab('EPAPER')}
                  className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'EPAPER' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  E-Paper
               </button>
               <button 
                  onClick={() => setActiveTab('ADS')}
                  className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'ADS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Ads
               </button>
               <button 
                  onClick={() => setActiveTab('SETTINGS')}
                  className={`pb-2 text-base font-semibold transition-colors ${activeTab === 'SETTINGS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Settings
               </button>
             </>
           )}
        </div>
      </div>

      {/* --- CONTENT: ARTICLES --- */}
      {activeTab === 'ARTICLES' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Article</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Editorial Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <img src={article.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {article.title}
                            {article.isFeatured && <Star size={12} className="inline ml-2 text-yellow-500 fill-current" />}
                          </p>
                          <p className="text-xs text-gray-500">{article.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{article.authorName}</td>
                    <td className="px-6 py-4"><StatusBadge status={article.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                          <>
                            {article.status !== 'PUBLISHED' && (
                              <button 
                                onClick={() => handleStatusChange(article.id, 'PUBLISHED')}
                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                title="Publish"
                              >
                                <CheckCircle size={14} /> Publish
                              </button>
                            )}
                            
                            {article.status === 'PUBLISHED' && (
                               <button 
                                onClick={() => handleStatusChange(article.id, 'DRAFT')}
                                className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                title="Unpublish"
                              >
                                <XCircle size={14} /> Unpublish
                              </button>
                            )}
                          </>

                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit Content">
                          <Edit3 size={16} />
                        </button>
                        
                        <button 
                          onClick={() => handleArticleDelete(article.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedArticles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No articles found.
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- CONTENT: COMMUNICATION --- */}
      {activeTab === 'COMMUNICATION' && (
         <ChatSystem />
      )}

      {/* --- CONTENT: TAXONOMY --- */}
      {activeTab === 'TAXONOMY' && canManageSystem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
           {/* Categories Column */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FolderTree className="text-indigo-600" size={24} />
                    Categories
                 </h3>
                 <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{categories.length} total</span>
              </div>
              
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                 <select
                   value={newCategoryType}
                   onChange={(e) => setNewCategoryType(e.target.value as 'ARTICLE' | 'CLASSIFIED')}
                   className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                 >
                    <option value="ARTICLE">Article</option>
                    <option value="CLASSIFIED">Classified</option>
                 </select>
                 <input 
                   type="text"
                   value={newCategoryName}
                   onChange={e => setNewCategoryName(e.target.value)}
                   className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="New Category Name..."
                 />
                 <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus size={20} />
                 </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                 {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors border border-gray-100">
                       <div className="flex items-center gap-3">
                          <span className="text-gray-400 group-hover:text-indigo-500 transition-colors"><FolderTree size={16} /></span>
                          <div>
                            <span className="font-medium text-gray-800 block">{cat.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${cat.type === 'CLASSIFIED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {cat.type}
                            </span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded border">{cat.count || 0} items</span>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
                 {categories.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No categories added yet.</p>}
              </div>
           </div>

           {/* Tags Column */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <TagIcon className="text-pink-600" size={24} />
                    Tags
                 </h3>
                 <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tags.length} total</span>
              </div>
              
              <form onSubmit={handleAddTag} className="flex gap-2 mb-6">
                 <input 
                   type="text"
                   value={newTagName}
                   onChange={e => setNewTagName(e.target.value)}
                   className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                   placeholder="New Tag Name..."
                 />
                 <button type="submit" className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors">
                    <Plus size={20} />
                 </button>
              </form>

              <div className="flex flex-wrap gap-2">
                 {tags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-gray-50 rounded-full group hover:bg-pink-50 transition-colors border border-gray-200 hover:border-pink-200">
                       <Hash size={12} className="text-gray-400 group-hover:text-pink-500" />
                       <span className="text-sm font-medium text-gray-700 group-hover:text-pink-700">{tag.name}</span>
                       <button onClick={() => handleDeleteTag(tag.id)} className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors">
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {tags.length === 0 && <p className="text-center text-gray-400 text-sm py-4 w-full">No tags added yet.</p>}
              </div>
           </div>
        </div>
      )}

      {/* --- CONTENT: ADS --- */}
      {activeTab === 'ADS' && canManageSystem && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
           <div 
              onClick={() => setIsAddAdModalOpen(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer group h-full min-h-[200px]"
           >
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center mb-3 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-semibold">Add Advertisement</span>
           </div>
           {ads.map(ad => (
             <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
               <div className="h-32 bg-gray-100 relative">
                 <img src={ad.imageUrl} alt={ad.clientName} className="w-full h-full object-cover" />
                 <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                   {ad.placement}
                 </span>
               </div>
               <div className="p-4 flex-1">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-gray-900">{ad.clientName}</h3>
                   <StatusBadge status={ad.status} />
                 </div>
                 <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                   <ExternalLink size={12} />
                   <span className="truncate">{ad.link}</span>
                 </div>
                 <div className="flex items-center gap-2 mt-auto pt-4 border-t">
                   <button 
                     onClick={() => handleAdStatusToggle(ad.id)}
                     className={`flex-1 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${ad.status === 'ACTIVE' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                   >
                     <Power size={14} />
                     {ad.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                   </button>
                   <button onClick={() => handleAdDelete(ad.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* --- CONTENT: CLASSIFIEDS --- */}
      {activeTab === 'CLASSIFIEDS' && canManageSystem && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {classifieds.map(ad => (
                   <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="font-bold text-gray-900">{ad.title}</p>
                         <p className="text-xs text-gray-500 mt-1">{ad.category} • {new Date(ad.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm">
                            <p><span className="text-gray-500">Price:</span> <span className="font-medium text-gray-800">{ad.price}</span></p>
                            <p><span className="text-gray-500">Loc:</span> {ad.location}</p>
                            <p><span className="text-gray-500">Contact:</span> {ad.contact}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge status={ad.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end space-x-2">
                            <button 
                               onClick={() => handleClassifiedStatusToggle(ad.id)}
                               className={`p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 ${ad.status === 'ACTIVE' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                               <Power size={14} /> {ad.status === 'ACTIVE' ? 'Close' : 'Activate'}
                            </button>
                            <button onClick={() => handleClassifiedDelete(ad.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
                 {classifieds.length === 0 && (
                    <tr>
                       <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No classified ads found.</td>
                    </tr>
                 )}
              </tbody>
            </table>
           </div>
        </div>
      )}

      {/* --- ADD PAGE MODAL --- */}
      {isAddPageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-gray-800">Add E-Paper Page</h3>
                 <button onClick={() => setIsAddPageModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleAddPage} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Page Number</label>
                     <input 
                        type="number" required min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newPageData.pageNumber}
                        onChange={e => setNewPageData({...newPageData, pageNumber: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                     <input 
                        type="date" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newPageData.date}
                        onChange={e => setNewPageData({...newPageData, date: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                     <input 
                        type="url" required placeholder="https://..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newPageData.imageUrl}
                        onChange={e => setNewPageData({...newPageData, imageUrl: e.target.value})}
                     />
                     <p className="text-xs text-gray-500 mt-1">Direct link to JPG/PNG image.</p>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                     <button type="button" onClick={() => setIsAddPageModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">Cancel</button>
                     <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center">
                        <Save size={18} className="mr-2" /> Add Page
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* --- ADD ARTICLE MODAL --- */}
      {isAddArticleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800">Create New Article</h3>
                 <button onClick={() => setIsAddArticleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleAddArticle} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Article Title</label>
                         <input 
                            type="text" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newArticleData.title}
                            onChange={e => setNewArticleData({...newArticleData, title: e.target.value})}
                            placeholder="e.g. Breaking News"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                         <input 
                            type="text" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newArticleData.category}
                            onChange={e => setNewArticleData({...newArticleData, category: e.target.value})}
                            placeholder="e.g. Technology, World"
                         />
                      </div>
                  </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                     <input 
                        type="url" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newArticleData.thumbnailUrl}
                        onChange={e => setNewArticleData({...newArticleData, thumbnailUrl: e.target.value})}
                        placeholder="https://..."
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Short Summary</label>
                     <textarea 
                        required rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        value={newArticleData.summary}
                        onChange={e => setNewArticleData({...newArticleData, summary: e.target.value})}
                        placeholder="Brief summary for list view..."
                     />
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Article Content (Rich Text)</label>
                     <RichTextEditor 
                        value={newArticleData.content} 
                        onChange={(html) => setNewArticleData({...newArticleData, content: html})}
                        placeholder="Write article content here..."
                     />
                  </div>

                  {/* Featured Toggle Option */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                           <Star size={16} className="text-yellow-600" /> Featured Article
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">Show this article in the Home Page Slideshow?</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={newArticleData.isFeatured}
                          onChange={e => setNewArticleData({...newArticleData, isFeatured: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t mt-4">
                     <button type="button" onClick={() => setIsAddArticleModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">Cancel</button>
                     <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center">
                        <Save size={18} className="mr-2" /> Publish Article
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* --- ADD AD MODAL --- */}
      {isAddAdModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-gray-800">Add Advertisement</h3>
                 <button onClick={() => setIsAddAdModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleAddAd} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                     <input 
                        type="text" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newAdData.clientName}
                        onChange={e => setNewAdData({...newAdData, clientName: e.target.value})}
                        placeholder="e.g. Local Coffee Shop"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                     <input 
                        type="url" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newAdData.imageUrl}
                        onChange={e => setNewAdData({...newAdData, imageUrl: e.target.value})}
                        placeholder="https://..."
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Target Link</label>
                     <input 
                        type="url" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newAdData.link}
                        onChange={e => setNewAdData({...newAdData, link: e.target.value})}
                        placeholder="https://..."
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                     <select 
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={newAdData.placement}
                        onChange={e => setNewAdData({...newAdData, placement: e.target.value as any})}
                     >
                        <option value="HEADER">Header</option>
                        <option value="SIDEBAR">Sidebar</option>
                        <option value="IN-FEED">In-Feed</option>
                     </select>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                     <button type="button" onClick={() => setIsAddAdModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">Cancel</button>
                     <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center">
                        <Save size={18} className="mr-2" /> Add Ad
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};
