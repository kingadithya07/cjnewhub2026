
import React, { useMemo, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { Layout } from './components/Layout';
import { ArticleList } from './modules/articles/ArticleList';
import { ArticleDetail } from './modules/articles/ArticleDetail';
import { EPaperViewer } from './modules/epaper/EPaperViewer';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { AuthAction } from './pages/AuthAction';
import { UpdatePassword } from './pages/UpdatePassword';
import { HeroSlider } from './components/HeroSlider';
import { supabase } from './services/supabaseClient';
import { Article, UserRole, EPaperPage, Classified } from './types';
import { Store, Newspaper, TrendingUp, MapPin, DollarSign, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: UserRole[] }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'NEWS' | 'CLASSIFIEDS'>('NEWS');
  const [articles, setArticles] = useState<Article[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const { data: art, error: artError } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'PUBLISHED')
          .order('created_at', { ascending: false });
        
        if (art) {
          setArticles(art.map(a => ({
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
        }

        const { data: cls } = await supabase
          .from('classifieds')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false });
        
        if (cls) setClassifieds(cls.map(c => ({
          id: c.id,
          title: c.title,
          content: c.content,
          location: c.location,
          price: c.price,
          contact: c.contact,
          category: c.category || 'General',
          createdAt: c.created_at,
          status: c.status
        })));
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
    const tabParam = searchParams.get('tab');
    if (tabParam === 'CLASSIFIEDS') setActiveTab('CLASSIFIEDS');
    else setActiveTab('NEWS');
  }, [searchParams]);

  const featuredArticles = useMemo(() => articles.filter(a => a.isFeatured).slice(0, 5), [articles]);
  const trendingArticles = useMemo(() => articles.filter(a => a.isTrending).slice(0, 5), [articles]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="font-bold text-gray-500 tracking-widest uppercase text-xs">Fetching Latest Edition...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 w-full">
            {featuredArticles.length > 0 ? (
              <HeroSlider articles={featuredArticles} />
            ) : (
              <div className="bg-[#111827] text-white p-12 rounded-2xl shadow-xl flex flex-col items-start justify-center relative overflow-hidden h-[400px]">
                  <div className="relative z-10">
                    <span className="bg-[#b4a070] text-black text-[10px] font-bold px-3 py-1 rounded-full mb-4 inline-block tracking-widest uppercase">CJ NEWS HUB</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight font-serif">Welcome to the Global Edition</h1>
                    <p className="text-gray-400 mb-6 text-lg">Your daily digital companion for world-class journalism.</p>
                  </div>
              </div>
            )}
        </div>
        <div className="lg:w-1/3 w-full">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                 <TrendingUp className="text-red-600" size={20} />
                 <h3 className="font-bold text-gray-900">Trending Now</h3>
              </div>
              <div className="space-y-4">
                 {trendingArticles.map((article, idx) => (
                    <div key={article.id} className="group cursor-pointer flex gap-3">
                       <span className="text-2xl font-bold text-gray-200 group-hover:text-[#b4a070] transition-colors w-8 flex-shrink-0 text-center">{idx + 1}</span>
                       <div>
                          <h4 className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                             {article.title}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">{article.category}</span>
                       </div>
                    </div>
                 ))}
                 {trendingArticles.length === 0 && <p className="text-xs text-gray-400 italic">No trending news currently.</p>}
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center space-x-6 border-b mb-6">
            <button onClick={() => setActiveTab('NEWS')} className={`pb-3 text-lg font-bold flex items-center space-x-2 transition-colors border-b-2 ${activeTab === 'NEWS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Newspaper size={20} />
              <span>Latest News</span>
            </button>
            <button onClick={() => setActiveTab('CLASSIFIEDS')} className={`pb-3 text-lg font-bold flex items-center space-x-2 transition-colors border-b-2 ${activeTab === 'CLASSIFIEDS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Store size={20} />
              <span>Classifieds</span>
            </button>
          </div>
          {activeTab === 'NEWS' ? <ArticleList articles={articles} /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classifieds.map(ad => (
                  <div key={ad.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                     <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600">{ad.title}</h3>
                     <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ad.content}</p>
                     <div className="flex flex-col space-y-2 text-sm text-gray-500 border-t pt-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1"><MapPin size={14} className="text-indigo-500" /><span>{ad.location}</span></div>
                           <div className="flex items-center gap-1 font-bold text-gray-900"><DollarSign size={14} className="text-green-600" /><span>{ad.price}</span></div>
                        </div>
                     </div>
                  </div>
                ))}
                {classifieds.length === 0 && <div className="col-span-2 text-center py-10 text-gray-400">No active classifieds.</div>}
             </div>
          )}
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
           <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center text-gray-400 border border-gray-200 sticky top-24">
               <span className="font-bold opacity-20 rotate-[-12deg] text-3xl">AD SPACE</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEPaper = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('epaper_pages')
        .select('*')
        .order('date', { ascending: false })
        .order('page_number', { ascending: true });
      
      if (data) {
        setEpaperPages(data.map(p => ({
          id: p.id,
          date: p.date,
          pageNumber: p.page_number,
          imageUrl: p.image_url,
          regions: p.regions || []
        })));
      }
      setLoading(false);
    };
    fetchEPaper();
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/auth-success" element={<AuthAction />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/articles/:id" element={<Layout><ArticleDetail /></Layout>} />
          <Route path="/epaper" element={<Layout><EPaperViewer pages={epaperPages} /></Layout>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.PUBLISHER, UserRole.EDITOR]}><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
