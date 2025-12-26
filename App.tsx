
import React, { useMemo, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { Layout } from './components/Layout';
import { ArticleList } from './modules/articles/ArticleList';
import { ArticleDetail } from './modules/articles/ArticleDetail';
import { EPaperViewer } from './modules/epaper/EPaperViewer';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { AuthAction } from './pages/AuthAction';
import { HeroSlider } from './components/HeroSlider';
import { supabase } from './services/supabaseClient';
import { Article, UserRole, EPaperPage, Classified } from './types';
import { Store, Newspaper, TrendingUp, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { MOCK_ARTICLES, MOCK_EPAPER } from './services/mockData';

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
        const { data: art } = await supabase.from('articles').select('*').eq('status', 'PUBLISHED');
        if (art && art.length > 0) {
          setArticles(art.map(a => ({...a, createdAt: a.created_at, authorName: a.author_name, authorAvatar: a.author_avatar, thumbnailUrl: a.thumbnail_url})));
        } else {
          setArticles(MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED'));
        }
        const { data: cls } = await supabase.from('classifieds').select('*').eq('status', 'ACTIVE');
        if (cls) setClassifieds(cls);
      } catch (err) {
        setArticles(MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED'));
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

  if (loading) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 w-full">
            {featuredArticles.length > 0 ? <HeroSlider articles={featuredArticles} /> : (
              <div className="bg-[#111827] text-white p-12 rounded-3xl shadow-xl h-[400px] flex items-center justify-center border-b-4 border-[#b4a070]">
                  <div className="text-center">
                    <span className="bg-[#b4a070] text-black text-[10px] font-black px-4 py-1.5 rounded-full mb-4 inline-block tracking-[0.2em] uppercase">CJ NEWS HUB</span>
                    <h1 className="text-5xl font-black mb-4 leading-tight font-serif tracking-tight">Global Edition</h1>
                    <p className="text-gray-400 uppercase text-[10px] tracking-[0.3em] font-bold">Archives & Digital Records</p>
                  </div>
              </div>
            )}
        </div>
        <div className="lg:w-1/3 w-full">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
              <div className="flex items-center space-x-2 mb-6 border-b border-gray-50 pb-4">
                 <TrendingUp className="text-red-600" size={20} />
                 <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Trending Now</h3>
              </div>
              <div className="space-y-6">
                 {trendingArticles.map((article, idx) => (
                    <div key={article.id} className="group cursor-pointer flex gap-4">
                       <span className="text-3xl font-black text-gray-100 group-hover:text-[#b4a070] transition-colors w-8 text-center">{idx + 1}</span>
                       <div>
                          <h4 className="font-bold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{article.title}</h4>
                          <span className="text-[9px] uppercase font-black text-gray-400 mt-1 block tracking-widest">{article.category}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center space-x-8 border-b mb-8">
            <button onClick={() => setActiveTab('NEWS')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2 ${activeTab === 'NEWS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-800'}`}>
              <Newspaper size={18} /> News Archives
            </button>
            <button onClick={() => setActiveTab('CLASSIFIEDS')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2 ${activeTab === 'CLASSIFIEDS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-800'}`}>
              <Store size={18} /> Classifieds
            </button>
          </div>
          {activeTab === 'NEWS' ? <ArticleList articles={articles} /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classifieds.map(ad => (
                  <div key={ad.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                     <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600">{ad.title}</h3>
                     <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{ad.content}</p>
                     <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest"><MapPin size={14} />{ad.location}</div>
                        <div className="text-emerald-600 font-black text-sm">{ad.price}</div>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [epaperPages, setEpaperPages] = useState<EPaperPage[]>([]);
  useEffect(() => {
    supabase.from('epaper_pages').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setEpaperPages(data.map(p => ({ ...p, pageNumber: p.page_number, imageUrl: p.image_url })));
      } else {
        setEpaperPages(MOCK_EPAPER);
      }
    });
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
