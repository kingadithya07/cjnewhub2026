
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '../../types';
import { MOCK_USERS } from '../../services/mockData';

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

  // Initialize DB from Mock data if empty
  useEffect(() => {
    const existingUsers = localStorage.getItem('newsflow_users_db');
    if (!existingUsers) {
      localStorage.setItem('newsflow_users_db', JSON.stringify(MOCK_USERS));
    }

    // Check for active session
    const storedUser = localStorage.getItem('newsflow_active_user');
    if (storedUser) {
      setAuth({ user: JSON.parse(storedUser), isAuthenticated: true });
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersDb: User[] = JSON.parse(localStorage.getItem('newsflow_users_db') || '[]');
        
        // Find user by email and password
        // Note: In a real app, never store plain text passwords. This is for demo only.
        const foundUser = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (foundUser) {
          setAuth({ user: foundUser, isAuthenticated: true });
          localStorage.setItem('newsflow_active_user', JSON.stringify(foundUser));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersDb: User[] = JSON.parse(localStorage.getItem('newsflow_users_db') || '[]');
        
        // Check if exists
        if (usersDb.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          alert("Email already exists!");
          resolve(false);
          return;
        }

        const newUser: User = { 
          id: Date.now().toString(), 
          name, 
          email, 
          password, 
          role, 
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        };

        const updatedDb = [...usersDb, newUser];
        localStorage.setItem('newsflow_users_db', JSON.stringify(updatedDb));
        
        // Auto login after register
        setAuth({ user: newUser, isAuthenticated: true });
        localStorage.setItem('newsflow_active_user', JSON.stringify(newUser));
        resolve(true);
      }, 800);
    });
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
         const usersDb: User[] = JSON.parse(localStorage.getItem('newsflow_users_db') || '[]');
         const exists = usersDb.some(u => u.email.toLowerCase() === email.toLowerCase());
         resolve(exists);
      }, 1000);
    });
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('newsflow_active_user');
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
