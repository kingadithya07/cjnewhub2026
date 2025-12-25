
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
import { HeroSlider } from './components/HeroSlider'; // Import Slider
import { MOCK_ARTICLES, MOCK_EPAPER, MOCK_CLASSIFIEDS } from './services/mockData';
import { UserRole } from './types';
import { Store, Newspaper, TrendingUp, MapPin, DollarSign, ArrowRight } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: UserRole[] }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Home Page Component
const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'NEWS' | 'CLASSIFIEDS'>('NEWS');
  const publishedArticles = MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED');
  const activeClassifieds = MOCK_CLASSIFIEDS.filter(c => c.status === 'ACTIVE');
  
  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'CLASSIFIEDS') {
      setActiveTab('CLASSIFIEDS');
    } else {
      setActiveTab('NEWS');
    }
  }, [searchParams]);

  // Get top 5 featured articles for the slider
  const featuredArticles = useMemo(() => {
    return MOCK_ARTICLES
      .filter(a => a.status === 'PUBLISHED' && a.isFeatured)
      .slice(0, 5);
  }, []);

  const trendingArticles = useMemo(() => {
    return MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED' && a.isTrending).slice(0, 5);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Section: Slider (Left) + Trending (Right) */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Featured Slider (66% on Desktop) */}
        <div className="lg:w-2/3 w-full">
            {featuredArticles.length > 0 ? (
              <HeroSlider articles={featuredArticles} />
            ) : (
              <div className="bg-indigo-900 text-white p-8 md:p-12 rounded-2xl shadow-xl flex flex-col items-start justify-center relative overflow-hidden h-[400px]">
                  <div className="relative z-10 max-w-2xl">
                    <span className="bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block tracking-widest uppercase">NewsFlow</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Welcome to NewsFlow</h1>
                    <p className="text-indigo-200 mb-6 text-lg">Your daily source for the latest stories and e-paper editions.</p>
                  </div>
              </div>
            )}
        </div>

        {/* Right: Trending News (33% on Desktop, Stacked below on Mobile) */}
        <div className="lg:w-1/3 w-full flex flex-col space-y-6">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                 <TrendingUp className="text-red-600" size={20} />
                 <h3 className="font-bold text-gray-900">Trending Now</h3>
              </div>
              <div className="space-y-4">
                 {trendingArticles.map((article, idx) => (
                    <div key={article.id} className="group cursor-pointer flex gap-3">
                       <span className="text-2xl font-bold text-gray-200 group-hover:text-indigo-200 transition-colors w-8 flex-shrink-0 text-center">{idx + 1}</span>
                       <div>
                          <h4 className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                             {article.title}
                          </h4>
                          <span className="text-xs text-gray-500 mt-1 block">{article.category}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Middle Section: Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Feed */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex items-center space-x-6 border-b mb-6">
            <button 
              onClick={() => setActiveTab('NEWS')}
              className={`pb-3 text-lg font-bold flex items-center space-x-2 transition-colors border-b-2 ${activeTab === 'NEWS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <Newspaper size={20} />
              <span>Latest News</span>
            </button>
            <button 
              onClick={() => setActiveTab('CLASSIFIEDS')}
              className={`pb-3 text-lg font-bold flex items-center space-x-2 transition-colors border-b-2 ${activeTab === 'CLASSIFIEDS' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <Store size={20} />
              <span>Classifieds</span>
            </button>
          </div>

          {activeTab === 'NEWS' ? (
             <ArticleList articles={publishedArticles} />
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeClassifieds.map(ad => (
                  <div key={ad.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                     <div className="flex justify-between items-start mb-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">{ad.category}</span>
                        <span className="text-xs text-gray-500">{new Date(ad.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{ad.title}</h3>
                     <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ad.content}</p>
                     
                     <div className="flex flex-col space-y-2 text-sm text-gray-500 border-t pt-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1">
                             <MapPin size={14} className="text-indigo-500" />
                             <span>{ad.location}</span>
                           </div>
                           <div className="flex items-center gap-1 font-bold text-gray-900">
                             <DollarSign size={14} className="text-green-600" />
                             <span>{ad.price}</span>
                           </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center text-xs font-mono text-gray-600">
                           Contact: {ad.contact}
                        </div>
                     </div>
                  </div>
                ))}
                {activeClassifieds.length === 0 && (
                   <div className="col-span-2 text-center py-10 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                     No active classifieds at the moment.
                   </div>
                )}
             </div>
          )}
        </div>

        {/* Right Sidebar (Ads) */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
           {/* Mini Ad Space */}
           <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center text-gray-400 border border-gray-200 relative overflow-hidden sticky top-24">
               <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-0">
                  <span className="font-bold text-gray-400 rotate-[-12deg] text-3xl opacity-20">AD SPACE</span>
               </div>
               <div className="relative z-10 text-center p-4">
                  <p className="text-sm font-semibold text-gray-600">Advertise Here</p>
                  <button className="text-xs text-indigo-600 hover:underline mt-1">Contact Us</button>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/articles/:id" element={<Layout><ArticleDetail /></Layout>} />
          
          <Route path="/epaper" element={
            <Layout>
               <div className="mb-6">
                 <h2 className="text-2xl font-bold text-gray-800">Today's E-Paper</h2>
                 <p className="text-gray-500">Read, clip, and share your favorite news pieces.</p>
               </div>
              <EPaperViewer pages={MOCK_EPAPER} />
            </Layout>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute roles={[UserRole.ADMIN, UserRole.PUBLISHER, UserRole.EDITOR]}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
