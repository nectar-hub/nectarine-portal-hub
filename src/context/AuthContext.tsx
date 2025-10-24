
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
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
  console.log('[AUTH] useAuth hook called');
  const context = useContext(AuthContext);
  console.log('[AUTH] useAuth context value:', context);
  if (context === undefined) {
    console.error('[AUTH] useAuth called outside of AuthProvider!');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('[AUTH] AuthProvider initializing...');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Load user profile from Supabase
  const loadUserProfile = async (userId: string) => {
    console.log('[AUTH] Loading profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, is_admin, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AUTH] Error loading user profile:', error);
        return;
      }

      console.log('[AUTH] Profile loaded successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('[AUTH] Error in loadUserProfile:', error);
    }
  };

  // Setup auth state change listener and check for existing session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      // Check if email already exists
      const { data: existingEmailUser, error: emailCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        throw emailCheckError;
      }

      if (existingEmailUser) {
        throw new Error('An account with this email already exists');
      }

      // Check if phone already exists
      const { data: existingPhoneUser, error: phoneCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', userData.phone)
        .maybeSingle();

      if (phoneCheckError && phoneCheckError.code !== 'PGRST116') {
        throw phoneCheckError;
      }

      if (existingPhoneUser) {
        throw new Error('An account with this phone number already exists');
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            fullName: userData.fullName,
            phone: userData.phone,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Registration successful!",
        description: "Your account has been created.",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Please check your details and try again",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive"
      });
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent",
        description: "Check your inbox for a link to reset your password",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Password reset failed",
        description: error.message || "Please check your email and try again",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    try {
      // Note: For Supabase, we don't need to use the token directly in the API call
      // as it's already included in the URL and handled by Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset successful",
        description: "Your password has been updated",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Password reset failed",
        description: error.message || "An error occurred while resetting your password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = !!profile?.is_admin;
  
  console.log('[AUTH] Current auth state:', {
    user: user?.id,
    profile: profile?.id,
    isAdmin,
    profileIsAdmin: profile?.is_admin
  });

  console.log('[AUTH] AuthProvider rendering with context value');

  return (
    <AuthContext.Provider 
      value={{ 
        session,
        user, 
        profile,
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
