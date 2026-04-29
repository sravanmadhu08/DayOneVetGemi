import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, googleProvider, signInWithPopup, signOut } from '@/src/lib/firebase';
import { UserProfile } from '@/src/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateProgress: (moduleId: string, score: number) => Promise<void>;
  updateQuizStats: (score: number, totalQuestions: number, correctAnswers: number) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  promoteToAdmin: () => Promise<void>;
  promoteOtherToAdmin: (targetUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: Date.now(),
              progress: {}
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          } else {
            const data = userDoc.data() as UserProfile;
            // Check if user is an admin
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setProfile({ ...data, isAdmin: adminDoc.exists() });
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const updateProgress = async (moduleId: string, score: number) => {
    if (!user || !profile) return;
    
    const newProgress = {
      ...profile.progress,
      [moduleId]: {
        score: Math.max((profile.progress?.[moduleId]?.score || 0), score),
        completedAt: Date.now()
      }
    };

    try {
      await setDoc(doc(db, 'users', user.uid), { progress: newProgress }, { merge: true });
      setProfile({ ...profile, progress: newProgress });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateQuizStats = async (score: number, totalQuestions: number, correctAnswers: number) => {
    if (!user) return;

    try {
      // Fetch fresh data to avoid stale state issues in accumulation
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const currentData = userDoc.data() as UserProfile;
      
      const currentStats = currentData?.quizStats || {
        completed: 0,
        averageScore: 0,
        lastScore: 0,
        totalQuestions: 0,
        correctAnswers: 0
      };

      const newCompleted = currentStats.completed + 1;
      const newTotalQuestions = currentStats.totalQuestions + totalQuestions;
      const newCorrectAnswers = currentStats.correctAnswers + correctAnswers;
      const newAverageScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);

      const newQuizStats = {
        completed: newCompleted,
        averageScore: newAverageScore,
        lastScore: score,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers
      };

      await setDoc(doc(db, 'users', user.uid), { quizStats: newQuizStats }, { merge: true });
      
      // Update local state incrementally
      setProfile(prev => prev ? { ...prev, quizStats: newQuizStats } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      setProfile({ ...profile, ...data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const promoteToAdmin = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        promotedAt: Date.now()
      });
      setProfile(prev => prev ? { ...prev, isAdmin: true } : null);
    } catch (error) {
      console.error("Failed to promote to admin. Ensure rules allow this for your account.");
      throw error;
    }
  };

  const promoteOtherToAdmin = async (targetUid: string) => {
    if (!user || user.email !== 'sravan96mufc@gmail.com') return;
    try {
      await setDoc(doc(db, 'admins', targetUid), {
        promotedAt: Date.now(),
        promotedBy: user.email
      });
    } catch (error) {
      console.error("Failed to promote other to admin.", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateProgress, updateQuizStats, updateProfile, promoteToAdmin, promoteOtherToAdmin }}>
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
