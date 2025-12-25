
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string}>;
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

  // Check if Supabase is reachable
  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      // Even if 'profiles' doesn't exist yet, a successful handshake (no fetch error) means online
      setConnectionStatus('online');
    } catch (err: any) {
      if (err.message?.includes('fetch')) {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('online');
      }
    }
  };

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data && !error) {
        setAuth({
          user: { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar },
          isAuthenticated: true
        });
      } else {
        setAuth({
          user: { id: userId, name: email.split('@')[0], email: email, role: UserRole.READER },
          isAuthenticated: true
        });
      }
    } catch (err) {
      setAuth({
        user: { id: userId, name: email.split('@')[0], email: email, role: UserRole.READER },
        isAuthenticated: true
      });
    }
  };

  useEffect(() => {
    checkConnection();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id, session.user.email || '');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      console.error("Login Network Error:", e);
      return { 
        success: false, 
        error: "Failed to fetch: Connection to Supabase failed. Please check if your project is active and not paused." 
      };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const { error } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          data: { name, role },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      console.error("Registration Network Error:", e);
      return { 
        success: false, 
        error: "Failed to fetch: Could not reach Supabase servers. Ensure you have a stable internet connection and the project URL is correct." 
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error while sending reset link." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error while updating password." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshDeviceStatus = async () => {
    setIsDeviceApproved(true);
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      connectionStatus,
      isDeviceApproved, 
      login, 
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
