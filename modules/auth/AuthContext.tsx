
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState, Device } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { getDeviceId, getDeviceName } from '../../utils/device';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, requiresVerification?: boolean, requiresDeviceApproval?: boolean}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  verifyAccount: (email: string, code: string) => Promise<{success: boolean, error?: string}>;
  requestResetCode: (email: string) => Promise<{success: boolean, error?: string}>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{success: boolean, error?: string}>;
  refreshDeviceStatus: () => Promise<void>;
  approveDevice: (deviceId: string) => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isDeviceApproved: false
  });

  const checkDeviceStatus = async (profileId: string) => {
    const currentId = getDeviceId();
    const { data: deviceData } = await supabase
      .from('user_devices')
      .select('status')
      .eq('profile_id', profileId)
      .eq('device_id', currentId)
      .maybeSingle();
    
    return deviceData?.status === 'APPROVED';
  };

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('newsflow_session');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const approved = await checkDeviceStatus(user.id);
          setAuth({ user, isAuthenticated: true, isDeviceApproved: approved });
        } catch (e) {
          localStorage.removeItem('newsflow_session');
        }
      }
    };
    init();
  }, []);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const showInternalCode = (type: string, email: string, code: string) => {
    alert(`INTERNAL SECURITY SYSTEM\n\nAction: ${type}\nTarget: ${email}\n\nYour 6-digit code is: ${code}`);
  };

  const registerDevice = async (profileId: string) => {
    const currentId = getDeviceId();
    const currentName = getDeviceName();

    const { data: devices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('profile_id', profileId);

    const isFirstDevice = !devices || devices.length === 0;

    await supabase.from('user_devices').upsert({
      profile_id: profileId,
      device_id: currentId,
      device_name: currentName,
      is_primary: isFirstDevice,
      status: isFirstDevice ? 'APPROVED' : 'PENDING',
      last_used_at: new Date().toISOString()
    });

    if (isFirstDevice) {
      await supabase.from('profiles').update({ primary_device_id: currentId }).eq('id', profileId);
    }

    return isFirstDevice || devices?.find(d => d.device_id === currentId)?.status === 'APPROVED';
  };

  const login = async (email: string, password?: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('password_plain', password).maybeSingle();
    if (error || !data) return { success: false, error: "Invalid credentials." };
    if (!data.is_verified) return { success: false, requiresVerification: true };

    const isApproved = await registerDevice(data.id);
    const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
    
    setAuth({ user, isAuthenticated: true, isDeviceApproved: isApproved });
    localStorage.setItem('newsflow_session', JSON.stringify(user));

    if (!isApproved) {
        return { success: true, requiresDeviceApproval: true };
    }

    return { success: true };
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60000).toISOString();
    const { error } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      name, email, password_plain: password, role, is_verified: false,
      verification_code: code, code_expiry: expiry
    });
    if (error) return { success: false, error: error.message };
    showInternalCode("REGISTRATION", email, code);
    return { success: true };
  };

  const verifyAccount = async (email: string, code: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).eq('verification_code', code).maybeSingle();
    if (!data) return { success: false, error: "Invalid code." };
    
    await supabase.from('profiles').update({ is_verified: true, verification_code: null }).eq('email', email);
    await registerDevice(data.id); 
    
    const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
    setAuth({ user, isAuthenticated: true, isDeviceApproved: true });
    localStorage.setItem('newsflow_session', JSON.stringify(user));
    return { success: true };
  };

  const approveDevice = async (targetDeviceId: string) => {
    if (!auth.user) return;
    await supabase.from('user_devices')
      .update({ status: 'APPROVED' })
      .eq('profile_id', auth.user.id)
      .eq('device_id', targetDeviceId);
    
    // Refresh local state if current device was approved
    if (targetDeviceId === getDeviceId()) {
      setAuth(prev => ({ ...prev, isDeviceApproved: true }));
    }
  };

  const revokeDevice = async (targetDeviceId: string) => {
    if (!auth.user) return;
    await supabase.from('user_devices')
      .update({ status: 'REVOKED' })
      .eq('profile_id', auth.user.id)
      .eq('device_id', targetDeviceId);
  };

  const logout = () => {
    localStorage.removeItem('newsflow_session');
    setAuth({ user: null, isAuthenticated: false, isDeviceApproved: false });
  };

  const refreshDeviceStatus = async () => {
    if (auth.user) {
      const approved = await checkDeviceStatus(auth.user.id);
      setAuth(prev => ({ ...prev, isDeviceApproved: approved }));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      login, logout, register, verifyAccount,
      requestResetCode: async () => ({success:false}), 
      resetPasswordWithCode: async () => ({success:false}),
      refreshDeviceStatus,
      approveDevice,
      revokeDevice
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
