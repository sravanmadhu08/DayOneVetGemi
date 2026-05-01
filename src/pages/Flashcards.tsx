import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Brain, 
  Library,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar,
  Zap,
  Command,
  Search,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  limit,
  orderBy
} from 'firebase/firestore';

const FLASHCARD_READ_LIMIT = 500;
import { calculateNextReview, ReviewQuality } from '@/src/lib/srs';
import { firebaseService } from '@/src/services/firebaseService';
import ReactMarkdown from 'react-markdown';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  userId?: string;
  tags?: string[];
}

interface FlashcardProgress {
  cardId: string;
  interval: number;
  ease: number;
  nextReview: number;
  lastReviewed: number;
  consecutiveCorrect: number;
}

export default function Flashcards() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('study');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({});
  const [loading, setLoading] = useState(true);
  
  // Study state
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Library state
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  
  // Create state
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newDeck, setNewDeck] = useState('General');

  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const { filteredCards, groupedDecks, sortedDecks } = useMemo(() => {
    const searchLower = librarySearchQuery.toLowerCase();
    const filtered = cards.filter(card => {
      const deck = card.deck || 'General';
      const front = card.front || '';
      const back = card.back || '';
      return (
        front.toLowerCase().includes(searchLower) ||
        back.toLowerCase().includes(searchLower) ||
        deck.toLowerCase().includes(searchLower)
      );
    });

    const grouped: Record<string, Flashcard[]> = {};
    filtered.forEach(card => {
      const key = card.deck || 'General';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(card);
    });

    const sorted = Object.keys(grouped).sort();
    return { filteredCards: filtered, groupedDecks: grouped, sortedDecks: sorted };
  }, [cards, librarySearchQuery]);

  useEffect(() => {
    if (!user) return;

    const qSystem = query(
      collection(db, 'flashcards'), 
      where('userId', 'in', ['system', null]),
      orderBy("createdAt", "desc"),
      limit(FLASHCARD_READ_LIMIT)
    );
    const qUser = query(
      collection(db, 'flashcards'), 
      where('userId', '==', user.uid),
      orderBy("createdAt", "desc"),
      limit(FLASHCARD_READ_LIMIT)
    );
    
    let systemCards: Flashcard[] = [];
    let userCards: Flashcard[] = [];
    
    const updateCards = () => setCards([...systemCards, ...userCards]);

    const unsubSystem = onSnapshot(qSystem, (snap) => {
      systemCards = snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
      updateCards();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
    });

    const unsubUser = onSnapshot(qUser, (snap) => {
      userCards = snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
      updateCards();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
    });

    const unsubProgress = onSnapshot(collection(db, 'users', user.uid, 'flashcardProgress'), (snap) => {
      const progressData: Record<string, FlashcardProgress> = {};
      snap.docs.forEach(d => {
        progressData[d.id] = d.data() as FlashcardProgress;
      });
      setProgress(progressData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/flashcardProgress`);
    });

    return () => {
      unsubSystem();
      unsubUser();
      unsubProgress();
    };
  }, [user]);

  useEffect(() => {
    const now = Date.now();
    const due = cards.filter(card => {
      const cardProgress = progress[card.id];
      return !cardProgress || cardProgress.nextReview <= now;
    });
    setStudyQueue(due.sort(() => Math.random() - 0.5));
    setLoading(false);
  }, [cards, progress]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFront || !newBack) return;

    if (getWordCount(newFront) > 200 || getWordCount(newBack) > 200) {
      toast.error('Tactical limits exceeded. Content too verbose.');
      return;
    }

    try {
      await addDoc(collection(db, 'flashcards'), {
        front: newFront,
        back: newBack,
        deck: newDeck || 'General',
        userId: user.uid,
        createdAt: serverTimestamp(),
        tags: [newDeck || 'General']
      });
      setNewFront('');
      setNewBack('');
      setNewDeck('General');
      toast.success('Intelligence asset deployed to library');
      setActiveTab('library');
    } catch (err) {
      toast.error('Deployment failure');
    }
  };

  const handleReview = async (quality: ReviewQuality) => {
    if (!user || studyQueue.length === 0) return;

    const currentCard = studyQueue[currentIndex];
    const currentProgress = progress[currentCard.id] || { interval: 0, ease: 2.5, consecutiveCorrect: 0 };
    
    const nextData = calculateNextReview(quality, currentProgress);
    const nextReviewTime = Date.now() + nextData.interval * 24 * 60 * 60 * 1000;

    const update: FlashcardProgress = {
      cardId: currentCard.id,
      ...nextData,
      nextReview: nextReviewTime,
      lastReviewed: Date.now()
    };

    try {
      await firebaseService.updateFlashcardProgress(user.uid, update);
      
      if (currentIndex < studyQueue.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        setStudyQueue([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        toast.success("Intelligence cycle completed");
      }
    } catch (err) {
      toast.error("Telemetry sync failed");
    }
  };

  const fetchCards = () => {
    const now = Date.now();
    const due = cards.filter(card => {
      const cardProgress = progress[card.id];
      return !cardProgress || cardProgress.nextReview <= now;
    });
    setStudyQueue(due.sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.info("Database re-indexed");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-12 w-12 relative">
           <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
           <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Neural Syncing...</p>
      </div>
    );
  }

  const getProseSizeClass = (text: string) => {
    if (text.length < 60) return "text-3xl font-black text-center leading-tight tracking-tight";
    if (text.length < 150) return "text-xl font-bold text-center leading-relaxed tracking-tight";
    return "text-base font-medium leading-relaxed";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
             <Brain className="h-3 w-3" strokeWidth={3} />
             Cognitive Optimization Module
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
            Professional <span className="text-primary italic">Memory</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg">Execute spaced-repetition protocols for clinical mastery.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-center bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 backdrop-blur-sm group hover:border-primary/30 transition-all">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Intelligence Assets</span>
             <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xl font-black">{Object.keys(progress).length}</span>
             </div>
          </div>
          <div className="flex flex-col items-center bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 backdrop-blur-sm group hover:border-primary/30 transition-all">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Due for Calibration</span>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xl font-black text-primary">{studyQueue.length}</span>
             </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16 p-2 bg-muted/30 backdrop-blur-md rounded-2xl mb-12 border border-border/40">
          <TabsTrigger value="study" className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all text-[10px] font-black uppercase tracking-widest">
            <Zap className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" /> Study Session
          </TabsTrigger>
          <TabsTrigger value="library" className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all text-[10px] font-black uppercase tracking-widest">
            <Library className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" /> Intel Library
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all text-[10px] font-black uppercase tracking-widest">
            <Plus className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" /> New Protocol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="mt-0">
          <AnimatePresence mode="wait">
            {studyQueue.length > 0 ? (
              <motion.div 
                key="study-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="relative perspective-1000 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex + (isFlipped ? '-back' : '-front')}
                      initial={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
                      className="w-full h-full select-none"
                    >
                      <Card 
                        className={`w-full min-h-[420px] shadow-2xl rounded-[3rem] cursor-pointer hover:scale-[1.01] transition-all duration-500 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden border border-border/40 ${isFlipped ? 'bg-primary border-primary shadow-primary/20' : 'bg-card'}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <div className="absolute top-10 left-10 flex items-center gap-3">
                           <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 border-2 ${isFlipped ? 'border-white/20 text-white/50' : 'border-primary/10 text-primary'}`}>
                              {studyQueue[currentIndex].deck || 'General'}
                           </Badge>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${isFlipped ? 'text-white/40' : 'text-muted-foreground/40'}`}>
                              Asset {currentIndex + 1} / {studyQueue.length}
                           </span>
                        </div>

                        <Zap className={`absolute -right-12 -top-12 h-64 w-64 opacity-5 -rotate-12 ${isFlipped ? 'text-white' : 'text-primary'}`} />

                        <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6">
                           <div className={`prose dark:prose-invert max-w-none ${isFlipped ? 'text-white' : 'text-foreground'} prose-img:rounded-3xl prose-img:max-h-64 ${getProseSizeClass(isFlipped ? studyQueue[currentIndex].back : studyQueue[currentIndex].front)}`}>
                              <ReactMarkdown>{isFlipped ? studyQueue[currentIndex].back : studyQueue[currentIndex].front}</ReactMarkdown>
                           </div>
                           
                           <AnimatePresence>
                              {!isFlipped && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex flex-col items-center gap-4 pt-10"
                                >
                                   <div className="h-0.5 w-12 bg-muted rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="h-full w-full bg-primary" 
                                      />
                                   </div>
                                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Tap to reveal telemetry</p>
                                </motion.div>
                              )}
                           </AnimatePresence>
                        </div>

                        <div className="absolute bottom-10 flex items-center gap-2 opacity-20">
                           <Command className={`h-4 w-4 ${isFlipped ? 'text-white' : 'text-foreground'}`} />
                           <span className={`text-[8px] font-black uppercase tracking-[0.5em] ${isFlipped ? 'text-white' : 'text-foreground'}`}>
                              Professional Memory Engine v4.0
                           </span>
                        </div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {isFlipped && (
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {[
                        { key: 'again', label: 'Failure', time: '1m', color: 'red', detail: 'Repeat cycle' },
                        { key: 'hard', label: 'Complex', time: '2d', color: 'orange', detail: 'Short delta' },
                        { key: 'good', label: 'Mastered', time: '4d', color: 'green', detail: 'Normal delta' },
                        { key: 'easy', label: 'Trivial', time: '7d', color: 'blue', detail: 'Long delta' }
                      ].map((btn) => (
                        <Button 
                          key={btn.key}
                          variant="outline" 
                          className={`h-24 flex flex-col items-center justify-center border-2 rounded-[2rem] bg-card hover:bg-${btn.color}-500/5 hover:border-${btn.color}-500/30 transition-all group overflow-hidden relative shadow-xl shadow-muted/5`}
                          onClick={() => handleReview(btn.key as ReviewQuality)}
                        >
                          <span className={`font-black uppercase tracking-widest text-[11px] mb-1 group-hover:text-${btn.color}-500 transition-colors`}>{btn.label}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{btn.time} Interval</span>
                          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${btn.color}-500/20 group-hover:h-2 transition-all`} />
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="study-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-24 text-center"
              >
                <Card className="border-none shadow-2xl shadow-muted/5 bg-card/50 backdrop-blur-sm rounded-[3rem] p-20 flex flex-col items-center border border-border/40">
                  <div className="h-32 w-32 rounded-[3rem] bg-emerald-500/10 flex items-center justify-center mb-10 rotate-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={3} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter mb-4">Inbox Zero Reached</h3>
                  <p className="text-muted-foreground font-medium text-lg max-w-sm mx-auto mb-10">You've successfully recalibrated all tactical knowledge blocks scheduled for today.</p>
                  <Button variant="outline" size="lg" onClick={fetchCards} className="h-16 px-10 rounded-2xl border-2 font-black uppercase tracking-widest text-xs hover:bg-muted/50">
                    <RotateCw className="h-5 w-5 mr-3" /> Re-sync Database
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="library" className="mt-0 space-y-8">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Query protocol definitions, decks, or internal tags..." 
              className="h-16 pl-14 pr-6 rounded-2xl bg-muted/20 border-none text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner"
              value={librarySearchQuery}
              onChange={(e) => setLibrarySearchQuery(e.target.value)}
            />
            {loading && <RotateCw className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
          </div>

          <div className="grid gap-12">
            {(() => {
              if (filteredCards.length === 0) {
                return (
                  <div className="py-24 text-center space-y-6">
                    <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                       <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No results found in current security clearace levels.</p>
                    <Button variant="outline" onClick={() => setLibrarySearchQuery('')} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
                      Reset Filter
                    </Button>
                  </div>
                );
              }

              return sortedDecks.map(deck => (
                <div key={deck} className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <LayoutGrid className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black tracking-tight uppercase">{deck}</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{groupedDecks[deck].length} Protocols Loaded</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedDecks[deck].map(card => {
                      const isCurrentlyFlipped = flippedCardId === card.id;
                      return (
                        <Card 
                          key={card.id} 
                          className={`group hover:shadow-2xl hover:shadow-muted/10 transition-all duration-500 rounded-[2rem] border-border/40 cursor-pointer relative overflow-hidden flex flex-col p-8 ${isCurrentlyFlipped ? 'bg-primary border-primary shadow-primary/10' : 'bg-card'}`}
                          onClick={() => setFlippedCardId(isCurrentlyFlipped ? null : card.id)}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-2 ${isCurrentlyFlipped ? 'border-white/20 text-white/60' : 'border-muted'}`}>
                              {card.userId === user?.uid ? 'Intelligence' : 'Standard'}
                            </Badge>
                            {progress[card.id] ? (
                              <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isCurrentlyFlipped ? 'text-white/60' : 'text-emerald-500'}`}>
                                <CheckCircle2 className="h-3 w-3" /> Mastered
                              </div>
                            ) : (
                              <div className={`text-[9px] font-black uppercase tracking-widest opacity-20 ${isCurrentlyFlipped ? 'text-white' : ''}`}>Unstudied</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-h-[80px] flex items-center">
                            <div className={`prose dark:prose-invert max-w-none text-sm font-bold leading-relaxed ${isCurrentlyFlipped ? 'text-white' : 'text-foreground'}`}>
                              <ReactMarkdown>{isCurrentlyFlipped ? card.back : card.front}</ReactMarkdown>
                            </div>
                          </div>

                          <div className={`mt-6 pt-4 border-t border-dashed flex items-center justify-between text-[8px] font-black uppercase tracking-widest ${isCurrentlyFlipped ? 'border-white/10 text-white/40' : 'border-border/50 text-muted-foreground/30'}`}>
                             <span>{isCurrentlyFlipped ? 'REVEALING SOLUTION' : 'SECURE DEFINITION'}</span>
                             <span className="flex items-center gap-1">
                                <Search className="h-2 w-2" /> View Data
                             </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-0">
          <Card className="border-none shadow-2xl shadow-muted/5 bg-card/50 backdrop-blur-sm rounded-[3rem] p-12 lg:p-20 border border-border/40">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="space-y-4 text-center">
                 <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-6 rotate-12 transition-transform hover:rotate-0">
                    <Sparkles className="h-10 w-10 text-primary" strokeWidth={3} />
                 </div>
                 <h2 className="text-3xl font-black tracking-tighter uppercase">Intelligence Capture</h2>
                 <p className="text-muted-foreground font-medium text-lg">Define new cognitive protocols for personal clinical advancement.</p>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <Label htmlFor="front" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Query (Front)</Label>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getWordCount(newFront) > 200 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground/40'}`}>
                          {getWordCount(newFront)} / 200
                        </span>
                    </div>
                    <Textarea 
                      id="front" 
                      placeholder="Input clinical scenario or question..." 
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      required
                      className="min-h-[180px] rounded-3xl border-none bg-muted/20 p-8 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner resize-none appearance-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="back" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Procedural Result (Back)</Label>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getWordCount(newBack) > 200 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground/40'}`}>
                        {getWordCount(newBack)} / 200
                      </span>
                    </div>
                    <Textarea 
                      id="back" 
                      placeholder="Input operative standard or answer..." 
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      required
                      className="min-h-[180px] rounded-3xl border-none bg-muted/20 p-8 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner resize-none appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <Label htmlFor="deck" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Classification Deck</Label>
                   <div className="relative group">
                      <LayoutGrid className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="deck" 
                        placeholder="e.g. Neurology, Soft Tissue Surgery, Pharmacology..."
                        value={newDeck}
                        onChange={(e) => setNewDeck(e.target.value)}
                        required
                        className="h-16 pl-14 pr-6 rounded-2xl bg-muted/20 border-none text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner"
                      />
                   </div>
                </div>

                <Button type="submit" className="w-full h-18 rounded-3xl text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-5 w-5 mr-3" strokeWidth={3} /> Launch Intel Asset
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

