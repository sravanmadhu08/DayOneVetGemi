import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/lib/api';
import { toast } from 'sonner';
import { StudyModule, Flashcard, Question } from '@/src/types';
import { DashboardStats } from '@/src/components/dashboard/DashboardStats';
import { DashboardFlashcards } from '@/src/components/dashboard/DashboardFlashcards';
import { RecentModules } from '@/src/components/dashboard/RecentModules';
import { Activity, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [modules, setModules] = useState<StudyModule[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, any>>({});
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [importantQuestions, setImportantQuestions] = useState<Question[]>([]);
  
  const fetchDueCards = useCallback(async () => {
    if (!user) return;
    setLoadingCards(true);
    try {
      const userCards = await api.getDueFlashcards();
      
      const progMap: Record<string, any> = {};
      userCards.forEach((card: any) => {
        const p = card.progress;
        if (!p) return;
        progMap[String(p.flashcard)] = {
          id: p.id,
          cardId: String(p.flashcard),
          interval: p.interval,
          ease: p.ease,
          nextReview: new Date(p.next_review).getTime(),
          consecutiveCorrect: p.consecutive_correct
        };
      });
      setProgressData(progMap);

      setDueCards(userCards);
    } catch (err) {
      console.error('Error fetching due cards:', err);
    } finally {
      setLoadingCards(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchModules = async () => {
      try {
        const [modulesData, progressDataArr] = await Promise.all([
          api.getModules(),
          api.getModuleProgress(),
        ]);
        const progressMap: Record<string, any> = {};
        progressDataArr.forEach((progress: any) => {
          progressMap[String(progress.module)] = progress;
        });
        setModules(modulesData);
        setModuleProgress(progressMap);
      } catch (error) {
        console.error("Failed to fetch modules:", error);
      }
    };

    fetchModules();
    fetchDueCards();
  }, [user, fetchDueCards]);

  useEffect(() => {
    if (!user) return;

    const fetchImportantQuestions = async () => {
      try {
        const bookmarks = await api.getBookmarkedQuestions();
        setImportantQuestions(bookmarks.map((bookmark: any) => ({
          ...bookmark.question,
          isBookmarked: true,
        })));
      } catch (error) {
        console.error("Failed to fetch important questions:", error);
      }
    };

    fetchImportantQuestions();
  }, [user]);

  const handleReview = async (cardId: string, success: boolean) => {
    if (!user) return;

    try {
      const currentProgress = progressData[cardId] || { interval: 0, ease: 2.5, consecutiveCorrect: 0 };
      const quality = success ? 'good' : 'again';
      const { calculateNextReview } = await import('@/src/lib/srs');
      const nextData = calculateNextReview(quality, currentProgress as any);
      
      const nextReviewTime = Date.now() + nextData.interval * 24 * 60 * 60 * 1000;
      
      const payload = {
        flashcard: cardId,
        interval: nextData.interval,
        ease: nextData.ease,
        next_review: new Date(nextReviewTime).toISOString(),
        consecutive_correct: nextData.consecutiveCorrect
      };

      if (currentProgress.id) {
        await api.reviewFlashcard(currentProgress.id, payload);
      } else {
        await api.saveFlashcardProgress(payload);
      }

      setDueCards(prev => prev.filter(c => c.id !== cardId));
      toast.success(success ? "Concept Mastered" : "Scheduled For Review");
    } catch (err) {
      toast.error("Cloud Sync Failed");
    }
  };

  const completedModuleIds = Object.entries(moduleProgress)
    .filter(([, progress]) => progress.completed === true)
    .map(([moduleId]) => moduleId);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleToggleBookmark = async (question: Question) => {
    try {
      if (question.isBookmarked) {
        await api.unbookmarkQuestion(question.id);
        setImportantQuestions(prev => prev.filter(q => q.id !== question.id));
        toast.success("Removed from important questions");
      } else {
        await api.bookmarkQuestion(question.id);
        setImportantQuestions(prev => [{ ...question, isBookmarked: true }, ...prev]);
        toast.success("Marked important");
      }
    } catch (error) {
      toast.error("Could not update bookmark");
    }
  };

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
            <Activity className="h-3 w-3" />
            Clinical Learning Workspace
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
          <Card className="rounded-2xl border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-base font-black tracking-tight flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Important Questions
              </CardTitle>
              <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest">
                {importantQuestions.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {importantQuestions.length > 0 ? (
                importantQuestions.slice(0, 4).map((question) => (
                  <div key={question.id} className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                            {question.system}
                          </Badge>
                          {question.species?.slice(0, 2).map((item) => (
                            <Badge key={item} variant="outline" className="text-[9px]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-bold leading-relaxed break-words">
                          {question.question}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 shrink-0"
                        onClick={() => handleToggleBookmark(question)}
                        aria-label="Remove important question bookmark"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {question.explanation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Star questions to keep them here for review.
                </div>
              )}
            </CardContent>
          </Card>
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

