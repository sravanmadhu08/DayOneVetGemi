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
  const [reviewingCard, setReviewingCard] = useState<Flashcard | null>(null);
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
      setReviewingCard(null);
      setIsFlipped(false);
      toast.success(success ? "Mastered!" : "Will review soon");
    } catch (err) {
      toast.error("Failed to update progress");
    }
  };

  const completedModules = Object.keys(profile?.progress || {}).length;
  const totalModules = MOCK_MODULES.length;
  const progressPercentage = (completedModules / totalModules) * 100;

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
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
              <Progress value={progressPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedModules} of {totalModules} modules completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards Due</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
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

        <motion.div variants={item}>
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
              <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">
                  {profile?.quizStats?.averageScore || 0}%
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Avg</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-muted-foreground">Accuracy Trend</span>
                  <span className={profile?.quizStats?.lastScore && profile.quizStats.lastScore >= 70 ? "text-green-600" : "text-amber-600"}>
                    Last: {profile?.quizStats?.lastScore || 0}%
                  </span>
                </div>
                <Progress value={profile?.quizStats?.averageScore || 0} className="h-1.5" />
              </div>

              <div className="pt-2 border-t flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">{profile?.quizStats?.completed || 0} Sessions</span>
                <Link to="/quizzes" className="text-primary hover:underline font-semibold flex items-center">
                  Take Next <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate('/progress')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
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
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Modules</CardTitle>
            <CardDescription>Continue where you left off.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_MODULES.slice(0, 4).map((module) => (
                <div key={module.id} id={`module-item-${module.id}`} className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{module.title}</p>
                    <p className="text-sm text-muted-foreground">{module.category}</p>
                  </div>
                  <div className="ml-auto">
                    {profile?.progress?.[module.id] ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Completed</Badge>
                    ) : (
                      <Link to={`/modules/${module.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "opacity-0 group-hover:opacity-100 transition-opacity" })}>
                        Resume
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 mt-[67px]">
          <CardHeader>
            <CardTitle>Study Queue</CardTitle>
            <CardDescription>Review pending cards inline.</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <div 
                      className="min-h-[250px] perspective-1000 cursor-pointer flex items-center justify-center"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className={`relative w-full h-[250px] transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden bg-muted/40 border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-inner">
                          <Badge variant="outline" className="mb-4 text-[12px] uppercase tracking-widest font-bold bg-background/80">{reviewingCard.deck}</Badge>
                          <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                            <p className="text-xl md:text-2xl font-bold leading-tight break-words max-w-full italic text-foreground">
                              {reviewingCard.front}
                            </p>
                          </div>
                          <p className="mt-6 text-[10px] text-muted-foreground flex items-center font-bold bg-background/80 px-4 py-1.5 rounded-full border shadow-sm">
                            <Eye className="h-3.5 w-3.5 mr-1.5" strokeWidth={3} /> TAP TO FLIP
                          </p>
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary/10 border-2 border-primary/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
                          <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                            <p className="text-xl md:text-2xl font-black text-primary leading-tight break-words max-w-full">
                              {reviewingCard.back}
                            </p>
                          </div>
                          <p className="mt-4 text-[9px] text-primary/60 uppercase font-black tracking-widest">Correct Answer</p>
                        </div>
                      </div>
                    </div>
                    {isFlipped && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleReview(reviewingCard.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" /> Hard
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() => handleReview(reviewingCard.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" /> Easy
                        </Button>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setReviewingCard(null); setIsFlipped(false); }}>
                      Cancel Review
                    </Button>
                  </motion.div>
                ) : dueCards.length > 0 ? (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {dueCards.slice(0, 5).map(card => (
                      <div 
                        key={card.id} 
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => { setReviewingCard(card); setIsFlipped(false); }}
                      >
                        <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Brain className="h-4 w-4 text-primary opacity-70" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors leading-tight">{card.front}</p>
                          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-tight mt-0.5">{card.deck}</p>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    <div className="pt-2">
                       <p className="text-[10px] text-center text-muted-foreground mb-2 italic">
                        {dueCards.length > 5 ? `+ ${dueCards.length - 5} more cards pending` : 'Ready to review'}
                       </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs text-muted-foreground">No flashcards are due for review.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDueCards}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Refresh
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// Removed local Badge component
