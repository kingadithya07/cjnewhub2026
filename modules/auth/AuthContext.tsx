import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{success: boolean, error?: string}>;
  forgotPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setAuth({
          user: {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            avatar: data.avatar
          },
          isAuthenticated: true
        });
      } else {
        // Fallback if profile trigger hasn't finished yet
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuth({
            user: {
              id: user.id,
              name: user.user_metadata?.name || user.email || 'User',
              email: user.email || '',
              role: (user.user_metadata?.role as UserRole) || UserRole.READER,
            },
            isAuthenticated: true
          });
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<{success: boolean, error?: string}> => {
    if (!password) return { success: false, error: "Password required" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<{success: boolean, error?: string}> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // Role passed to SQL trigger via raw_user_meta_data
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) return { success: false, error: error.message };
    
    if (data.user) {
        await fetchUserProfile(data.user.id);
    }
    
    return { success: true };
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, register, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
