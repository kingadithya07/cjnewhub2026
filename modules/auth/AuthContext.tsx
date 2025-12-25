
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { getDeviceId, getDeviceName } from '../../utils/device';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, deviceStatus?: 'APPROVED' | 'PENDING'}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  forgotPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<{success: boolean, error?: string}>;
  verifyOTP: (email: string, token: string, type: 'signup' | 'recovery') => Promise<{success: boolean, error?: string}>;
  isDeviceApproved: boolean;
  isPrimaryDevice: boolean;
  refreshDeviceStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isDeviceApproved, setIsDeviceApproved] = useState(false);
  const [isPrimaryDevice, setIsPrimaryDevice] = useState(false);

  const getRedirectUrl = () => {
    return window.location.origin;
  };

  // Logic to register or check the current device against the user's trusted list
  const handleDeviceCheck = async (userId: string): Promise<'APPROVED' | 'PENDING'> => {
    const currentDeviceId = getDeviceId();
    const currentDeviceName = getDeviceName();

    // 1. Get all devices for this user
    const { data: devices, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('profile_id', userId);

    if (error) {
        console.error("Device check error", error);
        return 'PENDING'; 
    }

    // 2. If NO devices exist, this is the First Login -> Make PRIMARY
    if (!devices || devices.length === 0) {
        const { error: insertError } = await supabase.from('trusted_devices').insert({
            profile_id: userId,
            device_id: currentDeviceId,
            device_name: currentDeviceName,
            is_primary: true,
            status: 'APPROVED'
        });
        if (!insertError) {
            setIsDeviceApproved(true);
            setIsPrimaryDevice(true);
            return 'APPROVED';
        }
        return 'PENDING';
    }

    // 3. Check if THIS device exists
    const existingDevice = devices.find(d => d.device_id === currentDeviceId);

    if (existingDevice) {
        setIsPrimaryDevice(existingDevice.is_primary);
        if (existingDevice.status === 'APPROVED') {
            setIsDeviceApproved(true);
            // Update last active
            await supabase.from('trusted_devices').update({ last_active: new Date().toISOString() }).eq('id', existingDevice.id);
            return 'APPROVED';
        } else {
            setIsDeviceApproved(false);
            return 'PENDING';
        }
    } 

    // 4. Device is NEW and User has other devices -> Insert as PENDING & Request
    setIsDeviceApproved(false);
    setIsPrimaryDevice(false);
    
    // Insert new device
    await supabase.from('trusted_devices').insert({
        profile_id: userId,
        device_id: currentDeviceId,
        device_name: currentDeviceName,
        is_primary: false,
        status: 'PENDING'
    });

    // Create a security request for the Primary Device to see
    // Check if request already exists to avoid spamming
    const { data: existingReq } = await supabase.from('security_requests')
        .select('*')
        .eq('profile_id', userId)
        .eq('request_type', 'DEVICE_ADD')
        .eq('status', 'PENDING')
        .contains('details', { device_id: currentDeviceId });

    if (!existingReq || existingReq.length === 0) {
        await supabase.from('security_requests').insert({
            profile_id: userId,
            request_type: 'DEVICE_ADD',
            details: { device_id: currentDeviceId, device_name: currentDeviceName },
            requested_from_device: currentDeviceId,
            status: 'PENDING'
        });
    }

    return 'PENDING';
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data && !error) {
        setAuth({
          user: { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar },
          isAuthenticated: true
        });
        // Check device status in background
        await handleDeviceCheck(userId);
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
        setIsPrimaryDevice(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<{success: boolean, error?: string, deviceStatus?: 'APPROVED' | 'PENDING'}> => {
    if (!password) return { success: false, error: "Password required" };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    if (data.user) {
      // Credentials correct, now check device trust
      const status = await handleDeviceCheck(data.user.id);
      if (status === 'PENDING') {
         // We do NOT sign them out here immediately so we can show the "Pending" screen 
         // but dashboard access will be blocked by isDeviceApproved check.
         return { success: true, deviceStatus: 'PENDING' };
      }
      return { success: true, deviceStatus: 'APPROVED' };
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
    
    // If signup verification successful, mark this device as Primary automatically
    if (data.user) {
        await handleDeviceCheck(data.user.id);
    }
    return { success: true };
  };

  const refreshDeviceStatus = async () => {
    if (auth.user) await handleDeviceCheck(auth.user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false });
    setIsDeviceApproved(false);
    setIsPrimaryDevice(false);
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getRedirectUrl()}/#/reset-password?email=${encodeURIComponent(email)}`,
    });
    return !error;
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ 
        ...auth, 
        isDeviceApproved, 
        isPrimaryDevice, 
        login, 
        logout, 
        register, 
        forgotPassword, 
        updatePassword, 
        refreshDeviceStatus, 
        verifyOTP 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
