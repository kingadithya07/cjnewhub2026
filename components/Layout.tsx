
import React, { useState, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, LogOut, LayoutDashboard,
  Home, Newspaper, Store, User, LogIn
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatted Date: 19 DECEMBER 2025
  const dateStr = currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  // Formatted Time: SYDNEY: 12:20:38 AM (Using local time)
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: true });

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'E-PAPER', path: '/epaper' },
    { label: 'CLASSIFIEDS', path: '/?tab=CLASSIFIEDS' },
    { label: 'WORLD', path: '/?category=World' },
    { label: 'BUSINESS', path: '/?category=Business' },
    { label: 'TECHNOLOGY', path: '/?category=Technology' },
    { label: 'CULTURE', path: '/?category=Culture' },
    { label: 'SPORTS', path: '/?category=Sports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
       {/* CSS for Marquee */}
       <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
       `}</style>

        {/* --- TOP BAR --- */}
        <div className="border-b border-gray-200 text-[10px] md:text-xs tracking-widest text-gray-500 py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-2 md:gap-0">
           <div className="flex gap-4 md:gap-8">
              <span className="font-bold text-gray-700">{dateStr}</span>
              <span className="flex items-center gap-1">
                 <span className="opacity-50">LOCATION:</span> {timeStr}
              </span>
           </div>
           {/* Login/User Section - Hidden on Mobile */}
           <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                 <div className="flex items-center gap-3">
                    <span className="hidden md:inline font-bold">WELCOME, {user?.name.toUpperCase()}</span>
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.PUBLISHER) && (
                         <Link to="/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-bold">
                             <LayoutDashboard size={12} /> DASHBOARD
                         </Link>
                    )}
                    <button onClick={handleLogout} className="hover:text-red-600 flex items-center gap-1 font-bold">
                       <LogOut size={12} /> LOGOUT
                    </button>
                 </div>
              ) : (
                 <Link to="/login" className="font-bold hover:text-indigo-600 flex items-center gap-1">
                    LOGIN <span className="text-lg leading-none">→</span>
                 </Link>
              )}
           </div>
        </div>

        {/* --- MAIN HEADER --- */}
        <div className="py-8 px-4 md:px-8 border-b border-gray-100">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
              
              {/* Left: Search */}
              <div className="w-full md:w-1/4 order-2 md:order-1 hidden md:block">
                 <div className="relative border-b border-gray-300 max-w-[200px]">
                    <input 
                      type="text" 
                      placeholder="Search Archives..." 
                      className="w-full py-2 pl-0 pr-8 bg-transparent text-sm italic outline-none text-gray-600 placeholder-gray-400 font-serif"
                    />
                    <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 </div>
              </div>

              {/* Center: Logo */}
              <div className="w-full md:w-1/2 order-1 md:order-2 text-center">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>
                     CJ<span className="text-[#b4a070]">NEWS</span>HUB
                  </h1>
                  <div className="flex items-center justify-center gap-3 mt-3">
                     <div className="h-px bg-gray-300 w-8 md:w-16"></div>
                     <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-gray-500 uppercase font-medium">Est. 2025 • Global Edition</span>
                     <div className="h-px bg-gray-300 w-8 md:w-16"></div>
                  </div>
              </div>

              {/* Right: Subscribe */}
              <div className="w-full md:w-1/4 order-3 flex justify-center md:justify-end">
                 <button className="bg-[#c8102e] hover:bg-[#a00d25] text-white font-bold text-xs px-6 py-3 shadow-sm transition-colors uppercase tracking-wider rounded-sm">
                    Subscribe Now
                 </button>
              </div>
           </div>
        </div>

        {/* --- NAVIGATION --- */}
        <div className="border-b border-gray-200 sticky top-0 bg-white z-50 shadow-sm h-14 md:h-14 flex items-center">
           <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="flex justify-between items-center w-full">
                 
                 {/* Mobile View: Menu + Name + Icons */}
                 <div className="flex md:hidden items-center justify-between w-full">
                     <div className="flex items-center gap-2">
                         <button className="p-1 -ml-1 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                         </button>
                         <span className="font-black text-2xl tracking-tight text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>
                            CJ<span className="text-[#b4a070]">NEWS</span>HUB
                         </span>
                     </div>
                     
                     <div className="flex items-center gap-1">
                         <Link to="/" className={`p-1 rounded hover:bg-gray-100 transition-colors ${location.pathname === '/' && !location.search.includes('tab=CLASSIFIEDS') ? 'text-indigo-600' : 'text-gray-500'}`}>
                            <Home size={24} />
                         </Link>
                         <Link to="/epaper" className={`p-1 rounded hover:bg-gray-100 transition-colors ${location.pathname === '/epaper' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            <Newspaper size={24} />
                         </Link>
                         <Link to="/?tab=CLASSIFIEDS" className={`p-1 rounded hover:bg-gray-100 transition-colors ${location.search.includes('tab=CLASSIFIEDS') ? 'text-indigo-600' : 'text-gray-500'}`}>
                            <Store size={24} />
                         </Link>
                         {isAuthenticated ? (
                             <Link to="/dashboard" className={`p-1 rounded hover:bg-gray-100 transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}>
                                <User size={24} />
                             </Link>
                         ) : (
                             <Link to="/login" className={`p-1 rounded hover:bg-gray-100 transition-colors ${location.pathname === '/login' ? 'text-indigo-600' : 'text-gray-500'}`}>
                                <LogIn size={24} />
                             </Link>
                         )}
                     </div>
                 </div>

                 {/* Desktop Nav */}
                 <nav className="hidden md:flex w-full justify-center items-center space-x-6 lg:space-x-10">
                    <Link to="/" className="font-black text-xl tracking-tight text-gray-900 mr-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                        CJ<span className="text-[#b4a070]">NEWS</span>HUB
                    </Link>

                    {navLinks.map(link => (
                       <Link 
                         key={link.label} 
                         to={link.path}
                         className="text-[11px] lg:text-xs font-bold text-gray-600 hover:text-black tracking-widest py-4 border-b-2 border-transparent hover:border-black transition-all"
                       >
                          {link.label}
                       </Link>
                    ))}
                 </nav>
              </div>
           </div>
           
           {/* Mobile Nav Drawer */}
           {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-100 bg-white absolute w-full left-0 top-14 shadow-lg max-h-[80vh] overflow-y-auto z-40">
                 {navLinks.map(link => (
                    <Link 
                      key={link.label}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-6 py-4 text-sm font-bold text-gray-700 border-b border-gray-50 hover:bg-gray-50"
                    >
                       {link.label}
                    </Link>
                 ))}
                 
                 <div className="border-t border-gray-100 mt-2 pt-2 bg-gray-50/50">
                    {isAuthenticated ? (
                        <>
                           <Link 
                              to="/dashboard"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block px-6 py-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                           >
                              DASHBOARD
                           </Link>
                           <button 
                              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                              className="block w-full text-left px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50"
                           >
                              LOGOUT
                           </button>
                        </>
                    ) : (
                        <Link 
                           to="/login"
                           onClick={() => setIsMobileMenuOpen(false)}
                           className="block px-6 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                           <LogIn size={16} /> LOGIN / REGISTER
                        </Link>
                    )}
                 </div>
              </div>
           )}
        </div>

        {/* --- BREAKING NEWS TICKER --- */}
        {/* Sticky on mobile (top-14), static on desktop. Visible on both. */}
        <div className="bg-black text-white text-xs flex overflow-hidden h-9 md:h-10 border-t-4 border-[#b4a070] sticky top-14 z-40 md:static md:z-auto">
           <div className="bg-[#b4a070] text-black font-black px-4 md:px-6 flex items-center tracking-widest z-10 shrink-0">
              <span className="mr-2">🔥</span> BREAKING
           </div>
           <div className="flex-1 flex items-center overflow-hidden relative">
              <div className="animate-marquee whitespace-nowrap flex items-center">
                 <span className="mx-4 font-bold text-[#b4a070]">BUSINESS</span>
                 <span className="mr-12 font-medium">Global Markets Rally as Tech Sector Rebounds Unexpectedly +++</span>
                 <span className="mx-4 font-bold text-[#b4a070]">CULTURE</span>
                 <span className="mr-12 font-medium">The Renaissance of Modern Architecture in Europe +++</span>
                 <span className="mx-4 font-bold text-[#b4a070]">TECHNOLOGY</span>
                 <span className="mr-12 font-medium">New AI Regulations Proposed by Global Summit Leaders +++</span>
                 {/* Duplicate for seamless scroll */}
                 <span className="mx-4 font-bold text-[#b4a070]">BUSINESS</span>
                 <span className="mr-12 font-medium">Global Markets Rally as Tech Sector Rebounds Unexpectedly +++</span>
                 <span className="mx-4 font-bold text-[#b4a070]">CULTURE</span>
                 <span className="mr-12 font-medium">The Renaissance of Modern Architecture in Europe +++</span>
              </div>
           </div>
        </div>

        {/* --- PAGE CONTENT --- */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
           {children}
        </main>

        {/* --- FOOTER --- */}
        <footer className="bg-black text-white pt-16 pb-8 border-t-4 border-[#b4a070]">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-black mb-6 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                   CJ<span className="text-[#b4a070]">NEWS</span>HUB
                </h2>
                <div className="flex justify-center gap-6 mb-8 text-xs font-bold tracking-widest text-white">
                    <a href="#" className="hover:text-[#b4a070] transition-colors">ABOUT US</a>
                    <a href="#" className="hover:text-[#b4a070] transition-colors">CONTACT</a>
                    <a href="#" className="hover:text-[#b4a070] transition-colors">ADVERTISE</a>
                    <a href="#" className="hover:text-[#b4a070] transition-colors">PRIVACY</a>
                    <a href="#" className="hover:text-[#b4a070] transition-colors">TERMS</a>
                </div>
                <p className="text-white text-xs opacity-90">© 2025 CJNews Hub Global Edition. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
};
