import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, GlobalSettings, SubscriptionStatus } from '@/src/types';
import { toast } from 'sonner';
import { api } from '@/src/lib/api';

interface AuthContextType {
  user: any | null; // Placeholder for session user
  profile: UserProfile | null;
  globalSettings: GlobalSettings | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProgress: (moduleId: string, score: number) => Promise<void>;
  updateQuizStats: (score: number, totalQuestions: number, correctAnswers: number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  promoteToAdmin: () => Promise<void>;
  promoteOtherToAdmin: (targetUid: string) => Promise<void>;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  subscribe: (plan: string, months: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }

    try {
      const [profileData, statusData] = await Promise.all([
        api.getProfile(),
        api.getSubscriptionStatus()
      ]);
      
      setProfile(profileData);
      setSubscriptionStatus(statusData);
      // Construct a minimal user object to maintain compatibility with existing pages
      setUser({
        uid: profileData.uid,
        email: profileData.email,
        displayName: profileData.displayName,
      });
    } catch (error) {
      console.error("Error fetching user profile", error);
      setUser(null);
      setProfile(null);
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch global settings
    const fetchSettings = async () => {
      try {
        const response = await api.getSettings();
        setGlobalSettings(response.value || { isFreeMode: true });
      } catch (error) {
        console.error("Error fetching global settings", error);
        setGlobalSettings({ isFreeMode: true });
      }
    };

    fetchSettings();
    fetchProfile();
  }, [fetchProfile]);

  const signIn = async () => {
    toast.error("Google Sign-In is not initialized yet.");
  };

  const signInWithGoogleCredential = async (credential: string) => {
    try {
      const data = await api.googleLogin({ credential });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      await fetchProfile();
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.detail || "Google Sign-In failed");
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const data = await api.login({ username: email, password: pass });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      await fetchProfile();
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.detail || "Invalid email or password");
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      await api.register({
        username: email,
        email: email,
        password: pass,
        first_name: name
      });
      // Automatically log in after registration
      await signInWithEmail(email, pass);
    } catch (error: any) {
      const msg = error.username?.[0] || error.email?.[0] || "Failed to create account.";
      toast.error(msg);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    toast.info("Password reset via API not yet implemented.");
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  const updateProgress = async (moduleId: string, score: number) => {
    if (!user || !profile) return;
    try {
      // Logic for saving module progress is handled in ModuleDetail.tsx now
      // but if we want it here for convenience:
      await api.saveModuleProgress({
        module: moduleId,
        current_section_index: 0, // Placeholder or fetch actual
        completed: score >= 100
      });
      // Refresh profile to get updated progress map
      const updatedProfile = await api.getProfile();
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Update progress error", error);
    }
  };

  const updateQuizStats = async (score: number, totalQuestions: number, correctAnswers: number) => {
    if (!user) return;
    // Stats are typically calculated from QuizAttempt history in the back-end profile serializer
    // but if we want to force a refresh:
    try {
       const updatedProfile = await api.getProfile();
       setProfile(updatedProfile);
    } catch (error) {
       console.error("Failed to refresh profile stats", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const updated = await api.updateProfile(data);
      setProfile(updated);
    } catch (error) {
      console.error("Update profile error", error);
      throw error;
    }
  };

  const updateGlobalSettings = async (settings: Partial<GlobalSettings>) => {
    try {
      const response = await api.updateGlobalSettings(settings);
      setGlobalSettings(response.value);
      toast.success("Global settings synchronized");
    } catch (error) {
      console.error("Error updating settings", error);
      toast.error("Failed to update global settings");
      throw error;
    }
  };

  const subscribe = async (plan: string, months: number) => {
    toast.info("Subscription protocol in transition");
  };

  const promoteToAdmin = async () => {
    if (!user) return;
    try {
      await api.updateProfile({ isAdmin: true });
      await fetchProfile();
      toast.success("Privilege escalation successful");
    } catch (error) {
      console.error("Promotion error", error);
      toast.error("Promotion protocol rejected");
    }
  };

  const promoteOtherToAdmin = async (targetUid: string) => {
    // This would likely need a different endpoint or staff permissions
    toast.info("Remote promotion protocol in transition");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      globalSettings, 
      subscriptionStatus,
      loading, 
      signIn, 
      signInWithGoogleCredential,
      signInWithEmail, 
      signUpWithEmail, 
      resetPassword, 
      logout, 
      updateProgress, 
      updateQuizStats, 
      updateProfile, 
      promoteToAdmin, 
      promoteOtherToAdmin, 
      updateGlobalSettings, 
      subscribe 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
