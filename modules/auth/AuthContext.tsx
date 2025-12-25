
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { getDeviceId, getDeviceName } from '../../utils/device';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, isPendingDevice?: boolean}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  updatePassword: (newPassword: string) => Promise<{success: boolean, error?: string}>;
  forgotPassword: (email: string) => Promise<{success: boolean, error?: string}>;
  verifyOTP: (email: string, token: string, type: 'signup' | 'recovery') => Promise<{success: boolean, error?: string}>;
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

  const getRedirectUrl = () => {
    return window.location.origin;
  };

  const checkDeviceTrust = async (userId: string) => {
    const currentDeviceId = getDeviceId();
    
    const { data: devices, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('profile_id', userId);

    if (error) return false;

    if (devices.length === 0) {
      const { error: insertError } = await supabase
        .from('trusted_devices')
        .insert({
          profile_id: userId,
          device_id: currentDeviceId,
          device_name: getDeviceName(),
          is_primary: true,
          status: 'APPROVED'
        });
      
      if (!insertError) setIsDeviceApproved(true);
      return true;
    }

    const currentDevice = devices.find(d => d.device_id === currentDeviceId);
    
    if (currentDevice) {
      if (currentDevice.status === 'APPROVED') {
        setIsDeviceApproved(true);
        await supabase.from('trusted_devices').update({ last_active: new Date().toISOString() }).eq('id', currentDevice.id);
        return true;
      } else {
        setIsDeviceApproved(false);
        return false;
      }
    } else {
      setIsDeviceApproved(false);
      await supabase.from('trusted_devices').insert({
        profile_id: userId,
        device_id: currentDeviceId,
        device_name: getDeviceName(),
        is_primary: false,
        status: 'PENDING'
      });
      await supabase.from('security_requests').insert({
        profile_id: userId,
        request_type: 'DEVICE_ADD',
        details: { device_id: currentDeviceId, device_name: getDeviceName() },
        requested_from_device: currentDeviceId
      });
      return false;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data && !error) {
        setAuth({
          user: { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar },
          isAuthenticated: true
        });
        await checkDeviceTrust(userId);
      }
    } catch (err) { console.error("Profile error:", err); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuth({ user: null, isAuthenticated: false });
        setIsDeviceApproved(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) return { success: false, error: "Password required" };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    if (data.user) {
      const approved = await checkDeviceTrust(data.user.id);
      return { success: true, isPendingDevice: !approved };
    }
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email, 
      password, 
      options: { 
        data: { name, role },
        emailRedirectTo: getRedirectUrl()
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const verifyOTP = async (email: string, token: string, type: 'signup' | 'recovery') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type === 'signup' ? 'signup' : 'recovery'
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const forgotPassword = async (email: string) => {
    // Redirect to root to allow CatchAllRoute to parse the hash token correctly
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const refreshDeviceStatus = async () => {
    if (auth.user) await checkDeviceTrust(auth.user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false });
    setIsDeviceApproved(false);
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ ...auth, isDeviceApproved, login, logout, register, updatePassword, forgotPassword, refreshDeviceStatus, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
