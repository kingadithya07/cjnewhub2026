
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { MOCK_ARTICLES, MOCK_ADS, MOCK_EPAPER, MOCK_SETTINGS, MOCK_CATEGORIES, MOCK_TAGS, MOCK_CLASSIFIEDS } from '../services/mockData';
import { UserRole, Article, Advertisement, EPaperPage, WatermarkSettings, Category, Tag, Classified } from '../types';
import { 
  Plus, Edit3, Trash2, CheckCircle, Clock, XCircle, 
  Megaphone, FileText, Scissors, Layout, ExternalLink, Power, Image as ImageIcon,
  Save, X, Star, Settings, Type, Tags as TagIcon, FolderTree, Hash, Store, MapPin, DollarSign, MessageCircle, Lock
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
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [ads, setAds] = useState<Advertisement[]>(MOCK_ADS);
  const [pages, setPages] = useState<EPaperPage[]>(MOCK_EPAPER);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [classifieds, setClassifieds] = useState<Classified[]>(MOCK_CLASSIFIEDS);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(MOCK_SETTINGS.watermark);

  // Modals
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
  const [isAddAdModalOpen, setIsAddAdModalOpen] = useState(false);
  const [isAddClassifiedModalOpen, setIsAddClassifiedModalOpen] = useState(false);

  // Form States - Taxonomy
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'ARTICLE' | 'CLASSIFIED'>('ARTICLE');
  const [newTagName, setNewTagName] = useState('');

  // Form States - Others
  const [newPageData, setNewPageData] = useState({
    imageUrl: '',
    pageNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newArticleData, setNewArticleData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    thumbnailUrl: '',
    isFeatured: false
  });

  const [newAdData, setNewAdData] = useState({
    clientName: '',
    imageUrl: '',
    link: '',
    placement: 'SIDEBAR' as Advertisement['placement']
  });
  
  const [newClassifiedData, setNewClassifiedData] = useState({
     title: '',
     content: '',
     location: '',
     price: '',
     contact: '',
     category: ''
  });

  if (!user) return <div>Access Denied</div>;

  const isEditor = user.role === UserRole.EDITOR;
  const isAdmin = user.role === UserRole.ADMIN;
  const isPublisher = user.role === UserRole.PUBLISHER;
  
  // Permissions Logic
  // Admin & Editor can see system tabs (Ads, Epaper, Settings, etc)
  const canManageSystem = isAdmin || isEditor;
  // Admin can save directly. Editor needs approval.
  const canDirectlySaveSettings = isAdmin; 
  // All staff roles can see all articles in dashboard for management
  const displayedArticles = articles;

  // --- Settings Handlers ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (canDirectlySaveSettings) {
        MOCK_SETTINGS.watermark = watermarkSettings; // Simulate backend save
        alert('Settings Saved Globally!');
    } else {
        // Editor workflow
        alert('Update Request Sent: Admin approval required for changing global settings.');
        // Do not update MOCK_SETTINGS
    }
  };

  // --- Taxonomy Handlers ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      type: newCategoryType,
      count: 0
    };
    setCategories([...categories, newCat]);
    MOCK_CATEGORIES.push(newCat);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
    if(confirm('Delete this category?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim()
    };
    setTags([...tags, newTag]);
    MOCK_TAGS.push(newTag);
    setNewTagName('');
  };

  const handleDeleteTag = (id: string) => {
    if(confirm('Delete this tag?')) {
      setTags(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- Article Handlers ---
  const handleArticleDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this article?')) {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: Article['status']) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const newArticle: Article = {
      id: `new-${Date.now()}`,
      title: newArticleData.title,
      summary: newArticleData.summary,
      content: newArticleData.content || newArticleData.summary,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      // Admin/Publisher/Editor can publish directly in this updated spec
      status: 'PUBLISHED', 
      category: newArticleData.category || 'General',
      createdAt: new Date().toISOString(),
      thumbnailUrl: newArticleData.thumbnailUrl || 'https://picsum.photos/id/11/800/600',
      isFeatured: newArticleData.isFeatured
    };

    setArticles(prev => [newArticle, ...prev]);
    MOCK_ARTICLES.unshift(newArticle); // Sync mock data for view
    setIsAddArticleModalOpen(false);
    setNewArticleData({ title: '', summary: '', content: '', category: '', thumbnailUrl: '', isFeatured: false });
  };

  // --- Ad Handlers ---
  const handleAdStatusToggle = (id: string) => {
    setAds(prev => prev.map(ad => ({
      ...ad,
      status: ad.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    })));
  };

  const handleAdDelete = (id: string) => {
    if(confirm('Delete this advertisement?')) {
      setAds(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAd: Advertisement = {
      id: `ad-${Date.now()}`,
      clientName: newAdData.clientName,
      imageUrl: newAdData.imageUrl,
      link: newAdData.link,
      placement: newAdData.placement,
      status: 'ACTIVE'
    };
    
    setAds(prev => [newAd, ...prev]);
    MOCK_ADS.unshift(newAd);
    setIsAddAdModalOpen(false);
    setNewAdData({ clientName: '', imageUrl: '', link: '', placement: 'SIDEBAR' });
  };

  // --- Classifieds Handlers ---
  const handleClassifiedStatusToggle = (id: string) => {
    setClassifieds(prev => prev.map(c => ({
      ...c,
      status: c.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
    })));
  };

  const handleClassifiedDelete = (id: string) => {
    if(confirm('Delete this classified ad?')) {
        setClassifieds(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddClassified = (e: React.FormEvent) => {
    e.preventDefault();
    const newClassified: Classified = {
        id: `cl-${Date.now()}`,
        ...newClassifiedData,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
    };
    setClassifieds([newClassified, ...classifieds]);
    MOCK_CLASSIFIEDS.unshift(newClassified);
    setIsAddClassifiedModalOpen(false);
    setNewClassifiedData({ title: '', content: '', location: '', price: '', contact: '', category: '' });
  };

  // --- EPaper Handlers ---
  const handlePageDelete = (id: string) => {
    if (confirm('Delete this page from E-Paper?')) {
        setPages(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageData.imageUrl || !newPageData.pageNumber) return;

    const newPage: EPaperPage = {
      id: `p-${Date.now()}`,
      imageUrl: newPageData.imageUrl,
      pageNumber: parseInt(newPageData.pageNumber),
      date: newPageData.date,
      regions: []
    };

    setPages(prev => [...prev, newPage].sort((a,b) => a.pageNumber - b.pageNumber));
    // In a real app, this would be an API call
    MOCK_EPAPER.push(newPage); 
    
    setIsAddPageModalOpen(false);
    setNewPageData({ imageUrl: '', pageNumber: '', date: new Date().toISOString().split('T')[0] });
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

      {/* --- CONTENT: E-PAPER --- */}
      {activeTab === 'EPAPER' && canManageSystem && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {/* Upload New Page Card */}
           <div 
             onClick={() => setIsAddPageModalOpen(true)}
             className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer group min-h-[300px]"
           >
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center mb-3 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-semibold">Upload Page</span>
              <p className="text-xs mt-2 text-center">Add via URL</p>
           </div>

           {/* Page Cards */}
           {pages.map(page => (
               <div key={page.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="relative aspect-[2/3] bg-gray-100 group">
                      <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                           onClick={() => navigate(`/epaper?pageId=${page.id}`)}
                           className="bg-white text-indigo-900 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2"
                         >
                            <Scissors size={16} /> Edit Regions
                         </button>
                      </div>
                      <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">Page {page.pageNumber}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
                      <span className="text-sm font-medium text-gray-600">{page.date}</span>
                      <button onClick={() => handlePageDelete(page.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors">
                          <Trash2 size={18} />
                      </button>
                  </div>
               </div>
           ))}
        </div>
      )}

      {/* --- CONTENT: SETTINGS --- */}
      {activeTab === 'SETTINGS' && canManageSystem && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in duration-300 relative">
            {!canDirectlySaveSettings && (
                 <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                     <Lock className="text-orange-500 mt-0.5" size={20} />
                     <div>
                         <h4 className="font-bold text-orange-800 text-sm">Restricted Access</h4>
                         <p className="text-xs text-orange-700 mt-1">As an Editor, you can view settings, but changes require Admin approval.</p>
                     </div>
                 </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="text-gray-600" />
                Global Settings
            </h2>
            
            <form onSubmit={handleSaveSettings} className="space-y-8">
                {/* Watermark Section */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">E-Paper Watermark Configuration</h3>
                    <p className="text-sm text-gray-500 mb-6">These settings apply to all cropped clips generated from the E-Paper viewer.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
                                <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                                    <Type size={18} className="text-gray-400 mr-2 flex-shrink-0" />
                                    <input 
                                        type="text" 
                                        value={watermarkSettings.text}
                                        onChange={e => setWatermarkSettings({...watermarkSettings, text: e.target.value})}
                                        className="w-full outline-none bg-transparent"
                                        placeholder="e.g. NewsFlow E-Paper"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size Scale ({watermarkSettings.scale}x)</label>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">Small</span>
                                  <input 
                                      type="range" min="0.5" max="2.5" step="0.1"
                                      value={watermarkSettings.scale}
                                      onChange={e => setWatermarkSettings({...watermarkSettings, scale: parseFloat(e.target.value)})}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                  <span className="text-xs text-gray-500">Large</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                                 <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                                    <ImageIcon size={18} className="text-gray-400 mr-2 flex-shrink-0" />
                                    <input 
                                        type="url" 
                                        value={watermarkSettings.imageUrl}
                                        onChange={e => setWatermarkSettings({...watermarkSettings, imageUrl: e.target.value})}
                                        className="w-full outline-none bg-transparent"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center h-full pt-4 md:pt-0">
                                 <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg w-full transition-all">
                                    <input 
                                        type="checkbox" 
                                        checked={watermarkSettings.showDate}
                                        onChange={e => setWatermarkSettings({...watermarkSettings, showDate: e.target.checked})}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Include Date in Footer</span>
                                 </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row justify-end gap-3">
                     <button type="button" onClick={() => window.location.reload()} className="px-6 py-3 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        Discard Changes
                     </button>
                     <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                         {canDirectlySaveSettings ? <Save size={20} /> : <MessageCircle size={20} />}
                         {canDirectlySaveSettings ? 'Save Changes' : 'Request Approval'}
                     </button>
                </div>
            </form>
        </div>
      )}

      {/* --- ADD CLASSIFIED MODAL --- */}
      {isAddClassifiedModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-bold text-gray-800">Add Classified Ad</h3>
                   <button onClick={() => setIsAddClassifiedModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                   </button>
                </div>
                
                <form onSubmit={handleAddClassified} className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title</label>
                       <input 
                          type="text" required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newClassifiedData.title}
                          onChange={e => setNewClassifiedData({...newClassifiedData, title: e.target.value})}
                          placeholder="e.g. Apartment for Rent"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                       <select 
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={newClassifiedData.category}
                          onChange={e => setNewClassifiedData({...newClassifiedData, category: e.target.value})}
                       >
                          <option value="">Select Category</option>
                          {categories
                            .filter(cat => cat.type === 'CLASSIFIED')
                            .map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                       </select>
                       <p className="text-xs text-gray-500 mt-1">Manage categories in the Taxonomy tab.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                           <input 
                              type="text" required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={newClassifiedData.price}
                              onChange={e => setNewClassifiedData({...newClassifiedData, price: e.target.value})}
                              placeholder="e.g. $500"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                           <input 
                              type="text" required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={newClassifiedData.location}
                              onChange={e => setNewClassifiedData({...newClassifiedData, location: e.target.value})}
                              placeholder="e.g. New York"
                           />
                        </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                       <input 
                          type="text" required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newClassifiedData.contact}
                          onChange={e => setNewClassifiedData({...newClassifiedData, contact: e.target.value})}
                          placeholder="Phone or Email"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                       <textarea 
                          required rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          value={newClassifiedData.content}
                          onChange={e => setNewClassifiedData({...newClassifiedData, content: e.target.value})}
                       />
                    </div>
                    
                    <div className="flex justify-end pt-2">
                       <button type="button" onClick={() => setIsAddClassifiedModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">Cancel</button>
                       <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center">
                          <Save size={18} className="mr-2" /> Publish Ad
                       </button>
                    </div>
                </form>
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
