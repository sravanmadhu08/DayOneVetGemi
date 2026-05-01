import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { firebaseService } from '@/src/services/firebaseService';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { StudyModule, Flashcard } from '@/src/types';
import { DashboardStats } from '@/src/components/dashboard/DashboardStats';
import { DashboardFlashcards } from '@/src/components/dashboard/DashboardFlashcards';
import { RecentModules } from '@/src/components/dashboard/RecentModules';
import { Sparkles, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [modules, setModules] = useState<StudyModule[]>([]);
  
  const fetchDueCards = useCallback(async () => {
    if (!user) return;
    setLoadingCards(true);
    try {
      const userCards = await firebaseService.getFlashcards(user.uid);
      const progressDataArr = await firebaseService.getFlashcardProgress(user.uid);
      
      const progressData: Record<string, any> = {};
      progressDataArr.forEach(p => {
        progressData[p.cardId] = p;
      });

      const now = Date.now();
      const due = userCards.filter(card => {
        const cardProgress = progressData[card.id];
        return !cardProgress || cardProgress.nextReview <= now;
      });

      setDueCards(due);
    } catch (err) {
      console.error('Error fetching due cards:', err);
    } finally {
      setLoadingCards(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Real-time modules subscription
    const qModules = query(collection(db, 'modules'));
    const unsubModules = onSnapshot(qModules, (snap) => {
      setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyModule)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    });

    fetchDueCards();

    return () => unsubModules();
  }, [user, fetchDueCards]);

  const handleReview = async (cardId: string, success: boolean) => {
    if (!user) return;

    try {
      // Re-fetch current progress just to be accurate
      const progressDataArr = await firebaseService.getFlashcardProgress(user.uid);
      const currentProgress = progressDataArr.find(p => p.cardId === cardId) || { interval: 0, ease: 2.5, consecutiveCorrect: 0 };
      
      // We map binary success to our SRS qualities: good (success) or again (fail)
      const quality = success ? 'good' : 'again';
      const { calculateNextReview } = await import('@/src/lib/srs');
      const nextData = calculateNextReview(quality, currentProgress as any);
      
      const nextReview = Date.now() + nextData.interval * 24 * 60 * 60 * 1000;
      
      await firebaseService.updateFlashcardProgress(user.uid, {
        cardId,
        ...nextData,
        nextReview,
        lastReviewed: Date.now()
      });

      setDueCards(prev => prev.filter(c => c.id !== cardId));
      toast.success(success ? "Concept Mastered" : "Scheduled For Review");
    } catch (err) {
      toast.error("Cloud Sync Failed");
    }
  };

  const completedModuleIds = Object.keys(profile?.progress || {});
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Sparkles className="h-3 w-3" />
            Clinical Intelligence App
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            DayOne<span className="text-primary italic">Vet</span>
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            Professional workspace for <span className="text-foreground font-bold">{profile?.displayName || 'Clinician'}</span>
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl border border-border/50"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground">{today}</span>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <DashboardStats 
        completedModules={completedModuleIds.length}
        totalModules={modules.length}
        dueCards={dueCards.length}
        accuracy={profile?.quizStats?.averageScore || 0}
        sessions={profile?.quizStats?.completed || 0}
      />

      {/* Main Content Areas */}
      <div className="grid gap-6 lg:grid-cols-12 place-items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <RecentModules 
            modules={modules}
            completedModuleIds={completedModuleIds}
          />
        </div>
        
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <DashboardFlashcards 
            dueCards={dueCards}
            loading={loadingCards}
            onReview={handleReview}
            onRefresh={fetchDueCards}
          />
        </div>
      </div>
    </div>
  );
}

