
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
    try {
      const existingUsers = localStorage.getItem('newsflow_users_db');
      if (!existingUsers) {
        localStorage.setItem('newsflow_users_db', JSON.stringify(MOCK_USERS));
      } else {
        // Validate JSON
        JSON.parse(existingUsers);
      }
    } catch (e) {
      console.error("Error parsing user DB, resetting to mock data", e);
      localStorage.setItem('newsflow_users_db', JSON.stringify(MOCK_USERS));
    }

    // Check for active session
    try {
      const storedUser = localStorage.getItem('newsflow_active_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
            setAuth({ user: parsedUser, isAuthenticated: true });
        } else {
            localStorage.removeItem('newsflow_active_user');
        }
      }
    } catch (e) {
      console.error("Error parsing active user, logging out", e);
      localStorage.removeItem('newsflow_active_user');
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
            const usersDb: User[] = JSON.parse(localStorage.getItem('newsflow_users_db') || '[]');
            
            // Find user by email and password
            const foundUser = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (foundUser) {
            setAuth({ user: foundUser, isAuthenticated: true });
            localStorage.setItem('newsflow_active_user', JSON.stringify(foundUser));
            resolve(true);
            } else {
            resolve(false);
            }
        } catch (e) {
            console.error("Login error", e);
            resolve(false);
        }
      }, 800);
    });
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
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
        } catch (e) {
            console.error("Register error", e);
            resolve(false);
        }
      }, 800);
    });
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
         try {
             const usersDb: User[] = JSON.parse(localStorage.getItem('newsflow_users_db') || '[]');
             const exists = usersDb.some(u => u.email.toLowerCase() === email.toLowerCase());
             resolve(exists);
         } catch (e) {
             resolve(false);
         }
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
