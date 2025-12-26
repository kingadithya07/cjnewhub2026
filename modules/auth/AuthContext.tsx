
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState, Device } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { getDeviceId, getDeviceName } from '../../utils/device';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, requiresVerification?: boolean, requiresDeviceApproval?: boolean}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  verifyAccount: (email: string, code: string) => Promise<{success: boolean, error?: string}>;
  requestResetCode: (email: string) => Promise<{success: boolean, error?: string, requiresPrimaryApproval?: boolean, devCode?: string, profileId?: string}>;
  checkResetStatus: (email: string) => Promise<{approved: boolean, error?: string}>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{success: boolean, error?: string}>;
  refreshDeviceStatus: () => Promise<void>;
  approveDevice: (deviceId: string) => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  approveResetRequest: (profileId: string) => Promise<void>;
  claimPrimaryDevice: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isDeviceApproved: false,
    isLoading: true
  });

  const checkDeviceStatus = async (profileId: string) => {
    try {
      const currentId = getDeviceId();
      const { data: deviceData } = await supabase
        .from('user_devices')
        .select('status')
        .eq('profile_id', profileId)
        .eq('device_id', currentId)
        .maybeSingle();
      
      return deviceData?.status === 'APPROVED';
    } catch (e) {
      return true; // Fail open if error
    }
  };

  const refreshDeviceStatus = async () => {
    if (auth.user) {
      const approved = await checkDeviceStatus(auth.user.id);
      setAuth(prev => ({ ...prev, isDeviceApproved: approved }));
    }
  };

  // Realtime Listener for Device Approval
  useEffect(() => {
    if (!auth.user) return;

    const channel = supabase.channel('device_sync')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_devices',
          filter: `profile_id=eq.${auth.user.id}`
        }, 
        () => {
          console.log('Realtime Device Update Received');
          refreshDeviceStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth.user]);

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('newsflow_session');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Don't await checkDeviceStatus to block render, but do it quickly
          const approved = await checkDeviceStatus(user.id);
          setAuth({ user, isAuthenticated: true, isDeviceApproved: approved, isLoading: false });
        } catch (e) {
          localStorage.removeItem('newsflow_session');
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } else {
         setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };
    init();
  }, []);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const registerDevice = async (profileId: string) => {
    const currentId = getDeviceId();
    const currentName = getDeviceName();

    // 1. Fetch ALL devices for this user
    const { data: devices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('profile_id', profileId);

    const safeDevices = devices || [];
    
    // 2. Check if THIS device is already registered
    const existingRecord = safeDevices.find(d => d.device_id === currentId);
    
    // 3. Check if ANY device (including this one if it's already primary) is currently Primary
    const hasExistingPrimary = safeDevices.some(d => d.is_primary);

    let isPrimary = false;
    let status: 'APPROVED' | 'PENDING' | 'REVOKED' = 'PENDING';

    if (existingRecord) {
        // SCENARIO A: Re-Login of an existing device.
        // CRITICAL: Preserve existing status. Do not downgrade.
        isPrimary = existingRecord.is_primary;
        status = existingRecord.status;
        
        // Self-Healing: If I am the ONLY device in the database, I must be Primary/Approved
        if (safeDevices.length === 1) {
            isPrimary = true;
            status = 'APPROVED';
        }
    } else {
        // SCENARIO B: Brand New Device (or first login after database clear)
        if (safeDevices.length === 0) {
            // I am the FIRST device ever. I am Primary.
            isPrimary = true;
            status = 'APPROVED';
        } else if (!hasExistingPrimary) {
            // Devices exist but NO primary? Claim Primary.
            isPrimary = true;
            status = 'APPROVED';
        } else {
            // A Primary exists elsewhere. I am Secondary. Wait for approval.
            isPrimary = false;
            status = 'PENDING';
        }
    }

    // Upsert with the calculated state
    await supabase.from('user_devices').upsert({
      profile_id: profileId,
      device_id: currentId,
      device_name: currentName,
      is_primary: isPrimary,
      status: status,
      last_used_at: new Date().toISOString()
    });

    if (isPrimary) {
      await supabase.from('profiles').update({ primary_device_id: currentId }).eq('id', profileId);
    }

    return status === 'APPROVED';
  };

  const claimPrimaryDevice = async () => {
    if (!auth.user) return;
    
    // 1. DELETE ALL existing devices for this user to effectively "Reset" security
    await supabase.from('user_devices').delete().eq('profile_id', auth.user.id);
    await supabase.from('profiles').update({ primary_device_id: null }).eq('id', auth.user.id);

    // 2. Re-register current device (Logic will now see 0 devices and make this Primary)
    await registerDevice(auth.user.id);
    
    // 3. Update local state
    refreshDeviceStatus();
  };

  const login = async (email: string, password?: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('password_plain', password).maybeSingle();
    if (error || !data) return { success: false, error: "Invalid credentials." };
    if (!data.is_verified) return { success: false, requiresVerification: true };

    const isApproved = await registerDevice(data.id);
    const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
    
    setAuth({ user, isAuthenticated: true, isDeviceApproved: isApproved, isLoading: false });
    localStorage.setItem('newsflow_session', JSON.stringify(user));

    return { success: true, requiresDeviceApproval: !isApproved };
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    // 1. Check if user already exists to prevent "duplicate key" database error
    const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    
    if (existingUser) {
        return { success: false, error: "Account already exists with this email. Please Login." };
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60000).toISOString();
    
    const { error } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      name, email, password_plain: password, role, is_verified: false,
      verification_code: code, code_expiry: expiry
    });
    
    if (error) return { success: false, error: error.message };
    
    // DEV ONLY: Alert code for testing
    alert(`DEV MODE REGISTRATION CODE: ${code}`);
    return { success: true };
  };

  const verifyAccount = async (email: string, code: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).eq('verification_code', code).maybeSingle();
    if (!data) return { success: false, error: "Invalid code." };
    
    await supabase.from('profiles').update({ is_verified: true, verification_code: null }).eq('email', email);
    await registerDevice(data.id); 
    
    const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
    setAuth({ user, isAuthenticated: true, isDeviceApproved: true, isLoading: false });
    localStorage.setItem('newsflow_session', JSON.stringify(user));
    return { success: true };
  };

  const requestResetCode = async (email: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (!profile) return { success: false, error: "Account not found." };

    const currentDeviceId = getDeviceId();
    const isPrimary = profile.primary_device_id === currentDeviceId;
    
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60000).toISOString();

    const { error } = await supabase.from('profiles').update({
      verification_code: code,
      code_expiry: expiry,
      reset_approval_status: isPrimary ? 'APPROVED' : 'PENDING'
    }).eq('email', email);

    if (error) {
        console.error("Supabase Reset Update Error:", error);
        return { success: false, error: "Database update failed. Check Permissions." };
    }

    // If Primary, return code immediately for UI display (Simulates email)
    if (isPrimary) {
        return { success: true, requiresPrimaryApproval: false, devCode: code, profileId: profile.id };
    }

    return { success: true, requiresPrimaryApproval: true, profileId: profile.id };
  };

  const checkResetStatus = async (email: string) => {
      const { data, error } = await supabase.from('profiles').select('reset_approval_status').eq('email', email).maybeSingle();
      if (error) return { approved: false, error: error.message };
      return { approved: data?.reset_approval_status === 'APPROVED' };
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).eq('verification_code', code).maybeSingle();
    
    if (!profile) return { success: false, error: "Invalid code." };
    if (profile.reset_approval_status !== 'APPROVED') return { success: false, error: "Reset pending primary device approval." };

    const { error } = await supabase.from('profiles').update({
      password_plain: newPassword,
      verification_code: null,
      reset_approval_status: 'APPROVED'
    }).eq('email', email);

    return error ? { success: false, error: "Update failed." } : { success: true };
  };

  const approveResetRequest = async (profileId: string) => {
    await supabase.from('profiles').update({ reset_approval_status: 'APPROVED' }).eq('id', profileId);
  };

  const approveDevice = async (targetDeviceId: string) => {
    if (!auth.user) return;
    await supabase.from('user_devices')
      .update({ status: 'APPROVED' })
      .eq('profile_id', auth.user.id)
      .eq('device_id', targetDeviceId);
    
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
    setAuth({ user: null, isAuthenticated: false, isDeviceApproved: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      login, logout, register, verifyAccount,
      requestResetCode, checkResetStatus,
      resetPasswordWithCode,
      refreshDeviceStatus,
      approveDevice,
      revokeDevice,
      approveResetRequest,
      claimPrimaryDevice
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
