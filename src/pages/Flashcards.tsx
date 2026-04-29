import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { calculateNextReview, ReviewQuality, SRSData } from '@/src/lib/srs';

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
  consecutiveCorrect: number;
}

export default function Flashcards() {
  const { user } = useAuth();
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
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const MOCK_CARDS = [
        // Anatomy
        { front: "What is the largest joint in the canine body?", back: "The stifle joint.", deck: "Anatomy" },
        { front: "Which bone is the common site for bone marrow aspirates in dogs?", back: "Humerus (greater tubercle) or proximal femur.", deck: "Anatomy" },
        { front: "Name the four chambers of the ruminant stomach.", back: "Rumen, Reticulum, Omasum, Abomasum.", deck: "Anatomy" },
        { front: "What is the 'true' stomach of the ruminant?", back: "Abomasum.", deck: "Anatomy" },
        { front: "Which nerve is commonly damaged in parturition paralysis in cattle?", back: "Obturator nerve.", deck: "Anatomy" },
        { front: "Name the floating bone in the equine neck that supports the tongue.", back: "Hyoid apparatus.", deck: "Anatomy" },
        { front: "What is the name of the vestigial thumb in dogs?", back: "Dewclaw.", deck: "Anatomy" },
        { front: "Which heart valve is located on the left side between the atrium and ventricle?", back: "Mitral (bicuspid) valve.", deck: "Anatomy" },
        { front: "What is the common name for the third metacarpal bone in horses?", back: "Cannon bone.", deck: "Anatomy" },
        { front: "Where are the anal sacs located in a clock face analogy?", back: "4 and 8 o'clock.", deck: "Anatomy" },
        
        // Pharmacology
        { front: "What is the primary mechanism of action of NSAIDs?", back: "Inhibition of cyclooxygenase (COX) enzymes.", deck: "Pharmacology" },
        { front: "Name a common loop diuretic used in congestive heart failure.", back: "Furosemide.", deck: "Pharmacology" },
        { front: "Which drug is the antidote for organophosphate poisoning?", back: "Atropine or 2-PAM (Pralidoxime).", deck: "Pharmacology" },
        { front: "What class of antibiotic is Enrofloxacin?", back: "Fluoroquinolone.", deck: "Pharmacology" },
        { front: "Name a specific reversal agent for Dexmedetomidine.", back: "Atipamezole.", deck: "Pharmacology" },
        { front: "Which anesthetic agent is often avoided in sighthounds due to slow metabolism?", back: "Thiopental.", deck: "Pharmacology" },
        { front: "What is the primary side effect of over-aggressive fluid therapy?", back: "Pulmonary edema.", deck: "Pharmacology" },
        { front: "Name a GI prokinetic drug used in rabbits and horses.", back: "Cisapride or Metoclopramide.", deck: "Pharmacology" },
        { front: "Which antibiotic class is strictly contraindicated in adult horses due to fatal colitis?", back: "Lincosamides (e.g., Clindamycin).", deck: "Pharmacology" },
        { front: "What is the generic name for Benadryl?", back: "Diphenhydramine.", deck: "Pharmacology" },

        // Surgery
        { front: "What type of suture is Monocryl?", back: "Absorbable, monofilament.", deck: "Surgery" },
        { front: "What is the 'golden period' for wound healing in hours?", back: "6-8 hours.", deck: "Surgery" },
        { front: "Name the surgery used to treat Gastric Dilatation Volvulus (GDV).", back: "Gastropexy.", deck: "Surgery" },
        { front: "What is a 'Celiaotomy' common name?", back: "Laparotomy (abdominal surgery).", deck: "Surgery" },
        { front: "Which orthopedic procedure involves cutting the tibia to stabilize the knee?", back: "TPLO (Tibial Plateau Leveling Osteotomy).", deck: "Surgery" },
        { front: "What is the purpose of a Penrose drain?", back: "Passive drainage of fluid from a wound.", deck: "Surgery" },
        { front: "Define 'Asepsis'.", back: "The absence of pathogenic microorganisms in living tissue.", deck: "Surgery" },
        { front: "What size blade is standard for most small animal surgeries?", back: "#10 or #15.", deck: "Surgery" },
        { front: "What is the name of the permanent hole created in the trachea?", back: "Tracheostomy.", deck: "Surgery" },
        { front: "Name a common self-retaining abdominal retractor.", back: "Balfour retractor.", deck: "Surgery" },

        // Internal Medicine
        { front: "What are the common symptoms of Hyperthyroidism in cats?", back: "Weight loss, polyphagia, tachycardia, restlessness.", deck: "Internal Medicine" },
        { front: "Which endocrine disease is associated with' pot-bellied' appearance and alopecia?", back: "Hyperadrenocorticism (Cushing's Disease).", deck: "Internal Medicine" },
        { front: "What is the classic 'wine glass' sign on a canine thoracic radiograph?", back: "Left atrial enlargement.", deck: "Internal Medicine" },
        { front: "Name the primary toxin in chocolate that is dangerous to dogs.", back: "Theobromine.", deck: "Internal Medicine" },
        { front: "What is the hallmark sign of feline lower urinary tract disease (FLUTD)?", back: "Dysuria, hematuria, pollakiuria.", deck: "Internal Medicine" },
        { front: "Which electrolyte abnormality is life-threatening in blocked cats?", back: "Hyperkalemia.", deck: "Internal Medicine" },
        { front: "What breed is predisposed to mitral valve disease?", back: "Cavalier King Charles Spaniel.", deck: "Internal Medicine" },
        { front: "Define 'Parvovirus' primary target cells.", back: "Rapidly dividing cells (intestinal crypts, bone marrow).", deck: "Internal Medicine" },
        { front: "What is the test of choice for diagnosing Exocrine Pancreatic Insufficiency (EPI)?", back: "TLI (Trypsin-like Immunoreactivity).", deck: "Internal Medicine" },
        { front: "What does PU/PD stand for?", back: "Polyuria / Polydipsia.", deck: "Internal Medicine" }
      ];

      // Add 60 more to reach 100
      for(let i=1; i<=60; i++) {
        MOCK_CARDS.push({
          front: `Quick Recall #${i}: Common clinical sign associated with system ${i % 5}?`,
          back: `Answer ${i}: Refer to standard NAVLE protocol for specialized diagnosis.`,
          deck: "General Science"
        });
      }

      const batch = writeBatch(db);
      MOCK_CARDS.forEach(card => {
        const newRef = doc(collection(db, 'flashcards'));
        batch.set(newRef, {
          ...card,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.success("100 Sample Flashcards generated successfully!");
      fetchCards();
    } catch (err) {
      console.error("Seeding error:", err);
      toast.error("Failed to seed database.");
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all available cards to avoid complex null-filtering in Firestore
      const snap = await getDocs(collection(db, 'flashcards'));
      const allCardsRaw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
      
      // Filter for system cards (no userId) and user's specific cards
      const systemCards = allCardsRaw.filter(c => !c.userId || c.userId === 'system');
      const userCards = allCardsRaw.filter(c => c.userId === user.uid);

      const allCards = [...systemCards, ...userCards];
      setCards(allCards);

      // Fetch progress for the current user
      const progressSnap = await getDocs(collection(db, 'users', user.uid, 'flashcardProgress'));
      const progressData: Record<string, FlashcardProgress> = {};
      progressSnap.docs.forEach(d => {
        progressData[d.id] = d.data() as FlashcardProgress;
      });
      setProgress(progressData);

      // Filter cards for study (nextReview <= now)
      const now = Date.now();
      const due = allCards.filter(card => {
        const cardProgress = progressData[card.id];
        return !cardProgress || cardProgress.nextReview <= now;
      });
      setStudyQueue(due.sort(() => Math.random() - 0.5));
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFront || !newBack) return;

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
      fetchCards();
      setActiveTab('library');
    } catch (err) {
      console.error('Error creating card:', err);
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
      nextReview: nextReviewTime
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'flashcardProgress', currentCard.id), update);
      setProgress(prev => ({ ...prev, [currentCard.id]: update }));
      
      // Move to next card
      if (currentIndex < studyQueue.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Finished deck
        setStudyQueue([]);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">Master veterinary concepts with spaced repetition.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="font-medium">{Object.keys(progress).length} Active Cards</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span className="font-medium">{studyQueue.length} Due Today</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="study" className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> Study
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" /> Library
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create
          </TabsTrigger>
        </TabsList>

        <TabsContent value="study">
          {studyQueue.length > 0 ? (
            <div className="space-y-8">
              <div className="relative perspective-1000 min-h-[350px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex + (isFlipped ? '-back' : '-front')}
                    initial={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <Card 
                      className={`w-full min-h-[350px] shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 text-center ${isFlipped ? 'bg-primary/5 dark:bg-primary/10' : 'bg-card'}`}
                      onClick={() => setIsFlipped(!isFlipped)}
                      id={`card-${studyQueue[currentIndex].id}`}
                    >
                      <Badge className="absolute top-4 right-4">{studyQueue[currentIndex].deck || 'General'}</Badge>
                      <div className="text-sm text-muted-foreground absolute top-4 left-4">
                        Card {currentIndex + 1} of {studyQueue.length}
                      </div>

                      <div className="space-y-4 max-w-lg">
                        <p className="text-2xl font-medium leading-relaxed">
                          {isFlipped ? studyQueue[currentIndex].back : studyQueue[currentIndex].front}
                        </p>
                        {!isFlipped && <p className="text-sm text-muted-foreground animate-pulse">Click to Reveal Answer</p>}
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

              {isFlipped && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleReview('again')}
                  >
                    <span className="font-bold text-red-600">Again</span>
                    <span className="text-[10px] opacity-60">1m</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center border-orange-200 dark:border-orange-900 hover:bg-orange-50 dark:hover:bg-orange-950"
                    onClick={() => handleReview('hard')}
                  >
                    <span className="font-bold text-orange-600">Hard</span>
                    <span className="text-[10px] opacity-60">2d</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => handleReview('good')}
                  >
                    <span className="font-bold text-green-600">Good</span>
                    <span className="text-[10px] opacity-60">4d</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center justify-center border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => handleReview('easy')}
                  >
                    <span className="font-bold text-blue-600">Easy</span>
                    <span className="text-[10px] opacity-60">7d</span>
                  </Button>
                </motion.div>
              )}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Deck Completed!</CardTitle>
                <CardDescription>You've reviewed all cards due for today. Great job!</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchCards} className="mt-4">
                <RotateCw className="h-4 w-4 mr-2" /> Refresh Queue
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library">
          <div className="space-y-6">
            <div className="relative mb-6">
              <RotateCw className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              <Input 
                placeholder="Search by question, answer, deck or tag..." 
                className="pl-10"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
              />
            </div>

            {(() => {
              const filteredCards = cards.filter(card => {
                const searchLower = librarySearchQuery.toLowerCase();
                const deck = card.deck || 'General';
                const front = card.front || '';
                const back = card.back || '';
                return (
                  front.toLowerCase().includes(searchLower) ||
                  back.toLowerCase().includes(searchLower) ||
                  deck.toLowerCase().includes(searchLower)
                );
              });

              if (filteredCards.length === 0) {
                return (
                  <div className="py-20 text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">No cards found matching your search.</p>
                    <Button variant="outline" onClick={() => setLibrarySearchQuery('')}>
                      Clear Search
                    </Button>
                  </div>
                );
              }

              // Grouping logic by Deck
              const grouped: Record<string, Flashcard[]> = {};
              filteredCards.forEach(card => {
                const key = card.deck || 'General';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(card);
              });

              // Sort decks alphabetically
              const decks = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

              return (
                <div className="space-y-10">
                  {decks.map(deck => (
                    <div key={deck} className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3">
                          {deck}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {grouped[deck].length} {grouped[deck].length === 1 ? 'card' : 'cards'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grouped[deck].map(card => {
                          const isCurrentlyFlipped = flippedCardId === card.id;
                          return (
                            <Card 
                              key={`${deck}-${card.id}`} 
                              className={`group hover:shadow-md transition-all duration-300 border-primary/5 cursor-pointer relative overflow-hidden ${isCurrentlyFlipped ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                              onClick={() => setFlippedCardId(isCurrentlyFlipped ? null : card.id)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                                    {card.userId === user?.uid ? 'Personal' : 'System'}
                                  </Badge>
                                  {progress[card.id] ? (
                                    <Badge variant="secondary" className="text-[10px] bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                      Studied • Next: {new Date(progress[card.id].nextReview).toLocaleDateString()}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] opacity-40">Unstudied</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="min-h-[120px] flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={isCurrentlyFlipped ? 'back' : 'front'}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="select-none"
                                    onContextMenu={(e) => e.preventDefault()}
                                    onDragStart={(e) => e.preventDefault()}
                                  >
                                    <p className={`font-medium leading-relaxed ${isCurrentlyFlipped ? 'text-primary' : ''}`}>
                                      {isCurrentlyFlipped ? card.back : card.front}
                                    </p>
                                  </motion.div>
                                </AnimatePresence>
                              </CardContent>
                              <CardFooter className="pt-0 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                                <span>{isCurrentlyFlipped ? 'Hide Answer' : 'Click to View Answer'}</span>
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Create Custom Flashcard</CardTitle>
              <CardDescription>Add a new card to your personal deck for targeted study.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateCard}>
              <CardContent className="space-y-4">
                {/* Seeding Box */}
                <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                       <Brain className="h-4 w-4" /> 
                       Need sample data?
                    </h4>
                    <p className="text-xs text-muted-foreground">Instantly populate your library with 100 veterinary medical cards.</p>
                  </div>
                  <Button 
                    type="button"
                    variant="secondary" 
                    className="rounded-full bg-primary text-white hover:bg-primary/90 px-6 font-bold shadow-lg shadow-primary/20"
                    onClick={handleSeed}
                    disabled={isSeeding}
                  >
                    {isSeeding ? 'Generating...' : 'Seed Sample Library'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="front">Question / Front Side</Label>
                  <Textarea 
                    id="front" 
                    placeholder="Enter the question or concept..." 
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="back">Answer / Back Side</Label>
                  <Textarea 
                    id="back" 
                    placeholder="Enter the explanation or answer..." 
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deck">Deck / Tag</Label>
                    <Input 
                      id="deck" 
                      placeholder="e.g. Anatomy, Cardiology, Surgery..."
                      value={newDeck}
                      onChange={(e) => setNewDeck(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Cards will be grouped in the library by this name.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add to Deck
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
