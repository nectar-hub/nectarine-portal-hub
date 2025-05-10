
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
};

type RegisterData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock authentication functions for now - would connect to backend in real implementation
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // This would be a real API call in production
      console.log(`Login attempt with ${email}`);
      
      // For demo purposes, we'll simulate different user roles
      if (email.includes('admin')) {
        setUser({
          id: 'admin-123',
          name: 'Admin User',
          email: email,
          phone: '+1234567890',
          role: 'admin'
        });
      } else {
        setUser({
          id: 'user-123',
          name: 'Regular User',
          email: email,
          phone: '+1234567890',
          role: 'user'
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      // This would be a real API call in production
      console.log(`Registration for ${userData.email}`);
      
      // Simulate successful registration
      setUser({
        id: `user-${Math.floor(Math.random() * 1000)}`,
        name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: 'user'
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear user data
    setUser(null);
    // In a real app, you'd also remove tokens from localStorage, cookies, etc.
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      // This would be a real API call in production
      console.log(`Password reset requested for ${email}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    try {
      // This would be a real API call in production
      console.log(`Password reset with token ${token}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if there's an existing session on app load
  useEffect(() => {
    // In a real app, you'd check for tokens in localStorage or cookies
    // and validate them with your backend
    
    // Simulate checking session
    const checkSession = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // For demo purposes, we'll assume no existing session
        setUser(null);
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout,
        forgotPassword,
        resetPassword,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
