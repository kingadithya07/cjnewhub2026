
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase, supabaseUrl } from '../../services/supabaseClient';
import { MOCK_USERS } from '../../services/mockData';

// Added missing properties to AuthContextType to satisfy usage in Dashboard and the provider itself
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

  // Load session from local storage since we aren't using Supabase Auth
  useEffect(() => {
    const savedUser = localStorage.getItem('newsflow_session');
    if (savedUser) {
      setAuth({ user: JSON.parse(savedUser), isAuthenticated: true });
    }
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      setConnectionStatus('online');
      return true;
    } catch (err) {
      setConnectionStatus('offline');
      return false;
    }
  };

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

    try {
      // Check if user exists
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (existing) return { success: false, error: "Email already registered." };

      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        name,
        email,
        password_plain: password, // Plain for this exercise, usually hashed
        role,
        is_verified: false,
        verification_code: code,
        code_expiry: expiry,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      });

      if (error) throw error;

      // Simulate Email
      console.log(`%c[EMAIL SYSTEM] Verification code for ${email}: ${code}`, "color: #b4a070; font-weight: bold; font-size: 14px;");
      alert(`SYSTEM: Verification code sent to ${email}: ${code}`);
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const verifyAccount = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .single();

      if (error || !data) return { success: false, error: "Invalid verification code." };
      
      const expiry = new Date(data.code_expiry);
      if (expiry < new Date()) return { success: false, error: "Code has expired." };

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
      return { success: false, error: e.message };
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password_plain', password)
        .single();

      if (error || !data) return { success: false, error: "Invalid email or password." };
      
      if (!data.is_verified) {
        // Resend code if needed
        const code = generateCode();
        await supabase.from('profiles').update({ 
          verification_code: code, 
          code_expiry: new Date(Date.now() + 15 * 60000).toISOString() 
        }).eq('email', email);
        
        console.log(`%c[EMAIL SYSTEM] New code for ${email}: ${code}`, "color: #b4a070; font-weight: bold;");
        alert(`SYSTEM: Your account is not verified. New code sent: ${code}`);
        
        return { success: false, requiresVerification: true };
      }

      const user: User = { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar };
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('newsflow_session', JSON.stringify(user));
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Authentication failed." };
    }
  };

  const requestResetCode = async (email: string) => {
    const code = generateCode();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          verification_code: code, 
          code_expiry: new Date(Date.now() + 15 * 60000).toISOString() 
        })
        .eq('email', email)
        .select();

      if (error || !data.length) return { success: false, error: "Email not found." };
      
      alert(`SYSTEM: Reset code sent to ${email}: ${code}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Failed to send code." };
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .single();

      if (error || !data) return { success: false, error: "Invalid reset code." };

      await supabase.from('profiles').update({ 
        password_plain: newPassword, 
        verification_code: null, 
        code_expiry: null 
      }).eq('email', email);

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

  const refreshDeviceStatus = async () => {
    await checkConnection();
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
      // Fixed: Interface now includes these placeholder implementations to prevent type errors
      updatePassword: async () => ({ success: false }),
      forgotPassword: async () => ({ success: false }),
      isDeviceApproved: true,
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
