import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_MODULES } from '@/src/data/mockData';
import { BookOpen, CheckCircle2, TrendingUp, Clock, Brain, AlertCircle, Sparkles, ChevronRight, Timer, RotateCcw, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  
  // Inline review state
  const reviewingCard = dueCards.length > 0 ? dueCards[0] : null;
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchDueCards = async () => {
    if (!user) return;
    setLoadingCards(true);
    try {
      // Fetch all cards (system + user)
      const systemQuery = query(collection(db, 'flashcards'), where('userId', '==', null));
      const systemSnap = await getDocs(systemQuery);
      const systemCards = systemSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));

      const userQuery = query(collection(db, 'flashcards'), where('userId', '==', user.uid));
      const userSnap = await getDocs(userQuery);
      const userCards = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));

      const allCards = [...systemCards, ...userCards].slice(0, 50); // Limit for dashboard

      // Fetch progress
      const progressSnap = await getDocs(collection(db, 'users', user.uid, 'flashcardProgress'));
      const progressData: Record<string, any> = {};
      progressSnap.docs.forEach(d => {
        progressData[d.id] = d.data();
      });

      const now = Date.now();
      const due = allCards.filter(card => {
        const cardProgress = progressData[card.id];
        return !cardProgress || cardProgress.nextReview <= now;
      });

      setDueCards(due);
    } catch (err) {
      console.error('Error fetching due cards:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchDueCards();
  }, [user]);

  const handleReview = async (cardId: string, success: boolean) => {
    if (!user) return;

    try {
      const nextReview = Date.now() + (success ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000); 
      await setDoc(doc(db, 'users', user.uid, 'flashcardProgress', cardId), {
        nextReview,
        lastReviewed: serverTimestamp(),
        successCount: success ? 1 : 0
      }, { merge: true });

      setDueCards(prev => prev.filter(c => c.id !== cardId));
      setIsFlipped(false);
      toast.success(success ? "Mastered!" : "Will review soon");
    } catch (err) {
      toast.error("Failed to update progress");
    }
  };

  const handleSkip = () => {
    if (dueCards.length > 0) {
      setDueCards(prev => [...prev.slice(1), prev[0]]);
      setIsFlipped(false);
    }
  };

  const completedModulesCount = Object.keys(profile?.progress || {}).length;
  const totalModules = MOCK_MODULES.length;
  const progressPercentage = (completedModulesCount / totalModules) * 100;

  const masteredModules = MOCK_MODULES.filter(m => profile?.progress?.[m.id]);
  const inProgressModules = MOCK_MODULES.filter(m => !profile?.progress?.[m.id]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName}</h1>
        <p className="text-muted-foreground">Here is your study progress overview.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item} className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
              <Progress value={progressPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedModulesCount} of {totalModules} modules completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards Due</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-2xl font-bold">{dueCards.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cards waiting for review
              </p>
              <Link to="/flashcards" className={buttonVariants({ variant: "link", size: "sm", className: "px-0 h-auto mt-2" })}>
                Review now
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-end">
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {profile?.quizStats?.averageScore || 0}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Avg</span>
                </div>
                
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">Accuracy Trend</span>
                    <span className={profile?.quizStats?.lastScore && profile.quizStats.lastScore >= 70 ? "text-green-600" : "text-amber-600"}>
                      Last: {profile?.quizStats?.lastScore || 0}%
                    </span>
                  </div>
                  <Progress value={profile?.quizStats?.averageScore || 0} className="h-1.5" />
                </div>
              </div>

              <div className="pt-2 mt-auto border-t flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">{profile?.quizStats?.completed || 0} Sessions</span>
                <Link to="/quizzes" className="text-primary hover:underline font-semibold flex items-center">
                  Take Next <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col" onClick={() => navigate('/progress')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-2xl font-bold">Insights</div>
              <p className="text-xs text-muted-foreground mt-1">
                View your clinical strengths
              </p>
              <div className="flex items-center text-[10px] text-primary font-bold mt-2 uppercase">
                Open Reports <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col h-full">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Study Modules</CardTitle>
                <CardDescription>Track your learning progress.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            <div className="space-y-4">
              {inProgressModules.length > 0 ? (
                inProgressModules.slice(0, 5).map((module) => (
                  <div key={module.id} id={`module-item-${module.id}`} className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left border border-transparent hover:border-border/50">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{module.title}</p>
                      <p className="text-sm text-muted-foreground">{module.category}</p>
                    </div>
                    <div className="ml-auto">
                      <Link to={`/modules/${module.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "opacity-0 group-hover:opacity-100 transition-opacity" })}>
                        Resume
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No active modules found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Study Queue</CardTitle>
            <CardDescription>Review pending cards inline.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {loadingCards ? (
                  <motion.p 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground text-center py-10"
                  >
                    Assembling your clinical queue...
                  </motion.p>
                ) : reviewingCard ? (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center px-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-primary border-primary/20 bg-primary/5">
                         {reviewingCard.deck}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground">{dueCards.length} left</span>
                    </div>
                    <div 
                      className="min-h-[350px] perspective-1000 cursor-pointer flex items-center justify-center select-none"
                      onClick={() => setIsFlipped(!isFlipped)}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <div className={`relative w-full h-[350px] transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-indigo-500/20 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-inner overflow-hidden">
                          <div className="flex-1 w-full overflow-y-auto py-2 custom-scrollbar">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-indigo-950 dark:text-indigo-100 prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto prose-img:max-h-[150px] object-contain flex flex-col items-center justify-center min-h-full">
                              <ReactMarkdown>{reviewingCard.front}</ReactMarkdown>
                            </div>
                          </div>
                          <p className="mt-4 shrink-0 text-[10px] text-indigo-700/70 dark:text-indigo-300/70 flex items-center font-bold bg-background/50 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm backdrop-blur-md">
                            <Eye className="h-3.5 w-3.5 mr-1.5" strokeWidth={3} /> TAP TO FLIP
                          </p>
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-lg overflow-hidden">
                          <div className="flex-1 w-full overflow-y-auto py-2 custom-scrollbar">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-emerald-900 dark:text-emerald-100 prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto prose-img:max-h-[150px] object-contain flex flex-col items-center justify-center min-h-full">
                              <ReactMarkdown>{reviewingCard.back}</ReactMarkdown>
                            </div>
                          </div>
                          <p className="mt-4 shrink-0 text-[9px] text-emerald-700/60 dark:text-emerald-300/60 uppercase font-black tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Correct Answer</p>
                        </div>
                      </div>
                    </div>
                    {isFlipped ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          className="font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400"
                          onClick={() => handleReview(reviewingCard.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" /> Hard
                        </Button>
                        <Button 
                          size="sm" 
                          className="font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400"
                          onClick={() => handleReview(reviewingCard.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" /> Easy
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs font-bold text-muted-foreground border-2 border-dashed border-border/50" onClick={handleSkip}>
                        Skip for now
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="demo"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center px-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-primary border-primary/20 bg-primary/5">
                         Demo Card
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> All caught up!</span>
                    </div>
                    <div 
                      className="min-h-[350px] perspective-1000 flex items-center justify-center select-none"
                      onClick={() => setIsFlipped(!isFlipped)}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <div className={`cursor-pointer relative w-full h-[350px] transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-indigo-500/20 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-inner overflow-hidden">
                          <p className="text-lg font-medium text-indigo-950 dark:text-indigo-100 mb-4 px-2 italic">You've completed all your due flashcards! Here's a sample card to show off the styling.</p>
                          <div className="w-16 h-1 mt-2 bg-indigo-500/20 rounded-full" />
                          <p className="mt-6 shrink-0 text-[10px] text-indigo-700/70 dark:text-indigo-300/70 flex items-center font-bold bg-background/50 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm backdrop-blur-md">
                            <Eye className="h-3.5 w-3.5 mr-1.5" strokeWidth={3} /> TAP TO FLIP
                          </p>
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-lg overflow-hidden">
                          <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-100 mb-2">Great job!</h3>
                          <p className="text-sm font-medium text-emerald-900/80 dark:text-emerald-100/80 mb-6">Check back later for more cards to review.</p>
                          <div className="w-16 h-1 bg-emerald-500/20 rounded-full" />
                          <p className="mt-8 shrink-0 text-[9px] text-emerald-700/60 dark:text-emerald-300/60 uppercase font-black tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Correct Answer</p>
                        </div>
                      </div>
                    </div>
                    {isFlipped ? (
                      <div className="flex justify-center">
                        <Button variant="outline" size="sm" onClick={() => setIsFlipped(false)}>
                          <RotateCcw className="h-3 w-3 mr-2" /> Reset Demo
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs font-bold text-muted-foreground border-2 border-dashed border-border/50" onClick={fetchDueCards}>
                         <RotateCcw className="h-3 w-3 mr-2" /> Refresh Queue
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-bold">Mastered Modules</h3>
        </div>
        {masteredModules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {masteredModules.map((module) => (
              <Card key={module.id} className="bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm leading-tight text-emerald-950 dark:text-emerald-50 truncate">{module.title}</h4>
                    <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-400/70 mt-1 uppercase tracking-wider truncate">{module.category}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
               <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-3">
                 <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 opacity-50" />
               </div>
               <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">No mastered modules yet</p>
               <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">Complete your study modules to see them here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
// Removed local Badge component
