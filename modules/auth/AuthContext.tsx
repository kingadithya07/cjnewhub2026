
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { MOCK_USERS } from '../../services/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string, requiresVerification?: boolean}>;
  loginAsDemo: (role?: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  verifyAccount: (email: string, code: string) => Promise<{success: boolean, error?: string}>;
  requestResetCode: (email: string) => Promise<{success: boolean, error?: string}>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{success: boolean, error?: string}>;
  updatePassword: () => Promise<{ success: boolean }>;
  forgotPassword: () => Promise<{ success: boolean }>;
  isDeviceApproved: boolean;
  connectionStatus: 'connecting' | 'online' | 'offline';
  refreshDeviceStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  useEffect(() => {
    const savedUser = localStorage.getItem('newsflow_session');
    if (savedUser) {
      try {
        setAuth({ user: JSON.parse(savedUser), isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('newsflow_session');
      }
    }
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      setConnectionStatus('online');
    } catch (err) {
      setConnectionStatus('offline');
    }
  };

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60000).toISOString();

    try {
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (existing) return { success: false, error: "This email is already registered." };

      const { error: insertError } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        name,
        email,
        password_plain: password,
        role,
        is_verified: false,
        verification_code: code,
        code_expiry: expiry,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      });

      if (insertError) throw insertError;

      // Simulation
      console.log(`[VERIFICATION] Code for ${email}: ${code}`);
      alert(`SYSTEM: Your verification code is ${code}`);
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Registration failed." };
    }
  };

  const verifyAccount = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .maybeSingle();

      if (error || !data) return { success: false, error: "Invalid code." };
      
      const expiry = new Date(data.code_expiry);
      if (expiry < new Date()) return { success: false, error: "Code expired." };

      await supabase.from('profiles').update({ 
        is_verified: true, 
        verification_code: null, 
        code_expiry: null 
      }).eq('email', email);

      const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('newsflow_session', JSON.stringify(user));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Verification failed." };
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password_plain', password)
        .maybeSingle();

      if (error || !data) return { success: false, error: "Invalid credentials." };
      
      if (!data.is_verified) {
        const code = generateCode();
        await supabase.from('profiles').update({ 
          verification_code: code, 
          code_expiry: new Date(Date.now() + 15 * 60000).toISOString() 
        }).eq('email', email);
        alert(`VERIFICATION: New code sent to ${email}: ${code}`);
        return { success: false, requiresVerification: true };
      }

      const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('newsflow_session', JSON.stringify(user));
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Login failed." };
    }
  };

  const requestResetCode = async (email: string) => {
    const code = generateCode();
    try {
      const { data, error } = await supabase.from('profiles').update({ 
        verification_code: code, 
        code_expiry: new Date(Date.now() + 15 * 60000).toISOString() 
      }).eq('email', email).select();

      if (error || !data || data.length === 0) return { success: false, error: "Email not found." };
      alert(`RESET: Your password reset code is ${code}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Request failed." };
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('verification_code', code).maybeSingle();
      if (error || !data) return { success: false, error: "Invalid code." };
      await supabase.from('profiles').update({ password_plain: newPassword, verification_code: null, code_expiry: null }).eq('email', email);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Reset failed." };
    }
  };

  const logout = () => {
    localStorage.removeItem('newsflow_session');
    setAuth({ user: null, isAuthenticated: false });
  };

  const loginAsDemo = (role: UserRole = UserRole.ADMIN) => {
    const mockUser = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setAuth({ user: mockUser, isAuthenticated: true });
    localStorage.setItem('newsflow_session', JSON.stringify(mockUser));
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      connectionStatus, 
      login, 
      loginAsDemo, 
      logout, 
      register, 
      verifyAccount,
      requestResetCode,
      resetPasswordWithCode,
      updatePassword: async () => ({ success: false }),
      forgotPassword: async () => ({ success: false }),
      isDeviceApproved: true,
      refreshDeviceStatus: async () => { await checkConnection(); }
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
