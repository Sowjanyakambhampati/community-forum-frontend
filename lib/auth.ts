import { supabase } from './supabase';
import { authAPI, usersAPI } from './api';
import { User } from '@/types';

// Custom event for auth state changes
const dispatchAuthChange = (user: User | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
  }
};

// Convert Supabase user to our User type
const mapSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
    fullName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.fullName || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.avatarUrl || '',
    createdAt: supabaseUser.created_at,
    role: supabaseUser.user_metadata?.role || 'user',
  };
};

// Sign up using Backend API (primary) with Supabase as fallback
export const signUp = async (email: string, password: string, username?: string, fullName?: string) => {
  try {
    // Try Backend API first
    const data = await authAPI.register(email, password, username, fullName);
    
    if (data.user && data.token) {
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username || username,
        fullName: data.user.fullName || fullName,
        avatarUrl: data.user.avatar || data.user.avatarUrl,
        createdAt: data.user.createdAt,
        role: data.user.role || 'user',
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      dispatchAuthChange(user);
      
      return {
        user,
        token: data.token,
        session: { access_token: data.token },
        message: 'Account created successfully!',
      };
    }
    
    return data;
  } catch (backendError: any) {
    console.log('Backend registration failed, trying Supabase:', backendError.message);
    
    // Fallback to Supabase
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            full_name: fullName || '',
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const user = mapSupabaseUser(data.user);
        
        if (typeof window !== 'undefined' && data.session) {
          localStorage.setItem('authToken', data.session.access_token);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        return {
          user,
          session: data.session,
          message: data.session 
            ? 'Account created successfully!' 
            : 'Please check your email to confirm your account.',
        };
      }

      return { user: null, session: null };
    } catch (supabaseError: any) {
      throw new Error(backendError.message || supabaseError.message || 'Failed to create account');
    }
  }
};

// Sign in using Backend API (primary) with Supabase as fallback
export const signIn = async (email: string, password: string) => {
  try {
    // Try Backend API first
    const data = await authAPI.login(email, password);
    
    if (data.user && data.token) {
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        fullName: data.user.fullName,
        avatarUrl: data.user.avatar || data.user.avatarUrl,
        createdAt: data.user.createdAt,
        role: data.user.role || 'user',
        rating: data.user.rating,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      dispatchAuthChange(user);
      
      return {
        user,
        token: data.token,
        session: { access_token: data.token },
      };
    }
    
    return data;
  } catch (backendError: any) {
    console.log('Backend login failed, trying Supabase:', backendError.message);
    
    // Fallback to Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        const user = mapSupabaseUser(data.user);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.session.access_token);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        dispatchAuthChange(user);
        
        return {
          user,
          token: data.session.access_token,
          session: data.session,
        };
      }

      throw new Error('Sign in failed');
    } catch (supabaseError: any) {
      // If both fail, throw the most relevant error
      throw new Error(backendError.message || supabaseError.message || 'Failed to sign in');
    }
  }
};

// Sign in with Google (Supabase OAuth)
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign in with GitHub (Supabase OAuth)
export const signInWithGithub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with GitHub');
  }
};

// Sign out from both Backend API and Supabase
export const signOut = async () => {
  try {
    // Try to logout from backend
    await authAPI.logout().catch(console.error);
    
    // Also sign out from Supabase
    await supabase.auth.signOut().catch(console.error);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      dispatchAuthChange(null);
      
      window.location.href = '/';
    }
  }
};

// Get current user - check Backend API first, then Supabase, then localStorage
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // First check if we have a token
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (token) {
      // Try to get fresh user data from Backend API
      try {
        const response = await usersAPI.getProfile();
        const userData = response.data || response;
        
        if (userData) {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            fullName: userData.fullName,
            avatarUrl: userData.avatar || userData.avatarUrl,
            createdAt: userData.createdAt,
            role: userData.role || 'user',
            rating: userData.rating,
          };
          
          localStorage.setItem('currentUser', JSON.stringify(user));
          return user;
        }
      } catch (apiError) {
        console.log('Backend API profile fetch failed, checking Supabase session');
      }
    }

    // Check Supabase session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session?.user) {
        const user = mapSupabaseUser(session.user);
        
        localStorage.setItem('authToken', session.access_token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return user;
      }
    } catch (supabaseError) {
      console.log('Supabase session check failed');
    }

    // Fallback to localStorage
    if (storedUser) {
      return JSON.parse(storedUser);
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get session
export const getSession = async () => {
  try {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        return { access_token: token };
      }
    }
    
    // Check Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Forgot password - try Backend API first, then Supabase
export const forgotPassword = async (email: string) => {
  try {
    // Try Backend API first
    const data = await authAPI.forgotPassword(email);
    return {
      success: true,
      message: data.message || 'Password reset email sent. Please check your inbox.',
    };
  } catch (backendError: any) {
    console.log('Backend forgot password failed, trying Supabase');
    
    // Fallback to Supabase
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (supabaseError: any) {
      throw new Error(backendError.message || supabaseError.message || 'Failed to send reset email');
    }
  }
};

// Reset password
export const resetPassword = async (newPassword: string, token?: string) => {
  try {
    if (token) {
      // Backend API reset with token
      const data = await authAPI.resetPassword(token, newPassword);
      return {
        success: true,
        message: data.message || 'Password updated successfully.',
      };
    } else {
      // Supabase reset (when user is redirected with session)
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Password updated successfully.',
        user: data.user ? mapSupabaseUser(data.user) : null,
      };
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Update profile
export const updateProfile = async (updates: {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
}) => {
  try {
    // Update via Backend API
    const response = await usersAPI.updateProfile(updates);
    const userData = response.data || response;
    
    if (userData) {
      const user: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        avatarUrl: userData.avatar || userData.avatarUrl,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        createdAt: userData.createdAt,
        role: userData.role || 'user',
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      dispatchAuthChange(user);
      
      return user;
    }
    
    return null;
  } catch (backendError: any) {
    console.log('Backend profile update failed, trying Supabase');
    
    // Fallback to Supabase
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          username: updates.username,
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const user = mapSupabaseUser(data.user);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        dispatchAuthChange(user);
        
        return user;
      }

      return null;
    } catch (supabaseError: any) {
      throw new Error(backendError.message || supabaseError.message || 'Failed to update profile');
    }
  }
};

// Listen for Supabase auth state changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user = mapSupabaseUser(session.user);
      localStorage.setItem('authToken', session.access_token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      dispatchAuthChange(user);
      
      // Try to sync with backend API after OAuth login
      try {
        // You could create a backend endpoint to sync OAuth users
        // await api.post('/auth/oauth-sync', { supabaseToken: session.access_token });
      } catch (error) {
        console.log('Backend sync skipped');
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      dispatchAuthChange(null);
    } else if (event === 'TOKEN_REFRESHED' && session) {
      localStorage.setItem('authToken', session.access_token);
    }
  });
}
