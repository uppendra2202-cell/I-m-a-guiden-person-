import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile } from '../lib/types';
import { dbService } from '../lib/databaseService';
import { getStoredSupabaseConfig } from '../lib/supabaseClient';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    birthDate: string;
    gender: UserProfile['gender'];
    interestedIn: UserProfile['interested_in'];
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const config = getStoredSupabaseConfig();
      setIsSupabaseConnected(config.isConfigured);
      const user = await dbService.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error('Error loading current user:', e);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await dbService.signIn(email, pass);
      setCurrentUser(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    displayName: string;
    birthDate: string;
    gender: UserProfile['gender'];
    interestedIn: UserProfile['interested_in'];
  }) => {
    setLoading(true);
    try {
      const res = await dbService.signUp(params);
      setCurrentUser(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await dbService.signOut();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const user = await dbService.getCurrentUser();
    setCurrentUser(user);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = await dbService.updateProfile(currentUser.id, updates);
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isSupabaseConnected,
        signIn,
        signUp,
        signOut,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
