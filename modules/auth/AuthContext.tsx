
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { getDeviceId, getDeviceName } from '../../utils/device';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, isPendingDevice?: boolean}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  forgotPassword: (email: string) => Promise<{success: boolean, error?: string}>;
  updatePassword: (newPassword: string) => Promise<{success: boolean, error?: string}>;
  isDeviceApproved: boolean;
  refreshDeviceStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isDeviceApproved, setIsDeviceApproved] = useState(false);

  const checkDeviceTrust = async (userId: string) => {
    setIsDeviceApproved(true); 
    return true;
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
      await checkDeviceTrust(userId);
    } catch (err) {
      setAuth({
        user: { id: userId, name: email.split('@')[0], email: email, role: UserRole.READER },
        isAuthenticated: true
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id, session.user.email || '');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setAuth({ user: null, isAuthenticated: false });
        setIsDeviceApproved(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      // Simplified registration: we don't try to use options.data if it causes DB trigger failures
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Network error or service unavailable." };
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
      return { success: false, error: "Failed to send recovery email." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Failed to update password." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshDeviceStatus = async () => {
    if (auth.user) await checkDeviceTrust(auth.user.id);
  };

  return (
    <AuthContext.Provider value={{ ...auth, isDeviceApproved, login, logout, register, forgotPassword, updatePassword, refreshDeviceStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
