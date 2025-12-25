
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase, supabaseUrl } from '../../services/supabaseClient';
import { MOCK_USERS } from '../../services/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string}>;
  loginAsDemo: (role?: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  forgotPassword: (email: string) => Promise<{success: boolean, error?: string}>;
  updatePassword: (newPassword: string) => Promise<{success: boolean, error?: string}>;
  connectionStatus: 'connecting' | 'online' | 'offline';
  isDeviceApproved: boolean;
  refreshDeviceStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [isDeviceApproved, setIsDeviceApproved] = useState(true);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, { 
        method: 'GET', 
        headers: { 'apikey': 'health-check' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok && response.status !== 401) throw new Error("Database probe failed");
      
      setConnectionStatus('online');
      return true;
    } catch (err: any) {
      console.warn("Supabase connectivity probe failed. Project might be paused.");
      setConnectionStatus('offline');
      return false;
    }
  };

  const reconcileProfile = async (userId: string, email: string, metadata: any) => {
    try {
      // 1. Try to find the existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) return profile;

      // 2. If profile doesn't exist (trigger failed), try to create it
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: metadata?.name || email.split('@')[0],
            email: email,
            role: metadata?.role || UserRole.READER
          })
          .select()
          .single();
        
        if (insertError) {
           console.error("Profile creation failed. Check RLS policies or if table exists.", insertError);
           return null;
        }
        return newProfile;
      }
      return null;
    } catch (e) {
      console.error("Reconciliation system error", e);
      return null;
    }
  };

  const fetchUserProfile = async (userId: string, email: string, metadata?: any) => {
    const profile = await reconcileProfile(userId, email, metadata);
    
    if (profile) {
      setAuth({
        user: { 
          id: profile.id, 
          name: profile.name, 
          email: profile.email, 
          role: profile.role as UserRole, 
          avatar: profile.avatar 
        },
        isAuthenticated: true
      });
      return true;
    } else {
      // If we can't find or create a profile, we don't log them in fully to avoid "dummy" states
      console.error("Critical: Could not resolve backend profile for authenticated user.");
      setAuth({ user: null, isAuthenticated: false });
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const isOnline = await checkConnection();
      
      if (isOnline) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
          }
        } catch (e) {
          console.error("Auth session check failed", e);
        }
      }

      const isDemo = window.sessionStorage.getItem('demo_mode');
      const demoUser = window.sessionStorage.getItem('demo_user');
      if (isDemo && demoUser) {
        setAuth({ user: JSON.parse(demoUser), isAuthenticated: true });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
      } else {
        if (!window.sessionStorage.getItem('demo_mode')) {
          setAuth({ user: null, isAuthenticated: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = (role: UserRole = UserRole.ADMIN) => {
    const mockUser = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setAuth({ user: mockUser, isAuthenticated: true });
    window.sessionStorage.setItem('demo_mode', 'true');
    window.sessionStorage.setItem('demo_user', JSON.stringify(mockUser));
  };

  const login = async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) return { success: false, error: error.message };
      
      window.sessionStorage.removeItem('demo_mode');
      window.sessionStorage.removeItem('demo_user');
      
      if (data.user) {
        const success = await fetchUserProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        if (!success) return { success: false, error: "Authenticated, but public profile table is missing. Contact Admin." };
      }
      
      return { success: true };
    } catch (e: any) {
      setConnectionStatus('offline');
      return { success: false, error: "Database unreachable. Project might be paused." };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: { data: { name, role } }
      });
      
      if (error) return { success: false, error: error.message };
      
      // If email confirmation is ON, data.session will be null.
      if (data.user && !data.session) {
        return { success: true, error: "CONFIRMATION_REQUIRED" };
      }

      if (data.user && data.session) {
        const success = await fetchUserProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        if (!success) return { success: false, error: "Account created, but database profile sync failed. Check SQL setup." };
      }
      
      return { success: true };
    } catch (e: any) {
      setConnectionStatus('offline');
      return { success: false, error: "Registration failed: Backend unreachable." };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error." };
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    window.sessionStorage.removeItem('demo_mode');
    window.sessionStorage.removeItem('demo_user');
    setAuth({ user: null, isAuthenticated: false });
  };

  const refreshDeviceStatus = async () => {
    await checkConnection();
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      connectionStatus,
      isDeviceApproved, 
      login, 
      loginAsDemo,
      logout, 
      register, 
      forgotPassword, 
      updatePassword, 
      refreshDeviceStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
