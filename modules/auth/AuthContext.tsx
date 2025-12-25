
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  // Fetch user profile (including role) from 'profiles' table
  const fetchProfile = async (userId: string, email: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            const user: User = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role as UserRole,
                avatar: data.avatar
            };
            setAuth({ user, isAuthenticated: true });
        } else {
             // Fallback if profile trigger failed
             setAuth({ 
                user: { id: userId, email: email, name: email.split('@')[0], role: UserRole.READER }, 
                isAuthenticated: true 
             });
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return !error;
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name } // Passed to trigger
        }
    });

    if (!error) {
        // Note: The Trigger in db_schema.sql creates the profile. 
        // However, for immediate update of Role (default is READER), we might need to manual update if allowed,
        // or the user must be READER first. For this demo, we assume the trigger handles creation.
        // If we want to enforce specific roles on signup (security risk if public), we would need a secure backend function.
        // Here we just let them sign up.
        return true;
    }
    return false;
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
