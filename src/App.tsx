import React, { useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { Layout } from './components/Layout';
import { ArticleList } from './modules/articles/ArticleList';
import { ArticleDetail } from './modules/articles/ArticleDetail';
import { EPaperViewer } from './modules/epaper/EPaperViewer';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { HeroSlider } from './components/HeroSlider'; // Import Slider
import { MOCK_ARTICLES, MOCK_EPAPER } from './services/mockData';
import { UserRole } from './types';

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
  const publishedArticles = MOCK_ARTICLES.filter(a => a.status === 'PUBLISHED');
  
  // Get top 5 featured articles for the slider
  const featuredArticles = useMemo(() => {
    return MOCK_ARTICLES
      .filter(a => a.status === 'PUBLISHED' && a.isFeatured)
      .slice(0, 5);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Featured Slider */}
      {featuredArticles.length > 0 ? (
        <HeroSlider articles={featuredArticles} />
      ) : (
        // Fallback if no featured articles
        <div className="bg-indigo-900 text-white p-8 md:p-12 rounded-2xl shadow-xl flex flex-col items-start justify-center relative overflow-hidden">
             <div className="relative z-10 max-w-2xl">
               <span className="bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block tracking-widest uppercase">NewsFlow</span>
               <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Welcome to NewsFlow</h1>
               <p className="text-indigo-200 mb-6 text-lg">Your daily source for the latest stories and e-paper editions.</p>
             </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Latest Short Articles</h2>
        <a href="#" className="text-indigo-600 font-medium text-sm hover:underline">View All</a>
      </div>

      <ArticleList articles={publishedArticles} />
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