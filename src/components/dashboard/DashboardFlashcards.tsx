import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Eye, ThumbsUp, ThumbsDown, RotateCcw, Command } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
}

interface DashboardFlashcardsProps {
  dueCards: Flashcard[];
  loading: boolean;
  onReview: (cardId: string, success: boolean) => Promise<void>;
  onRefresh: () => void;
}

export function DashboardFlashcards({ dueCards, loading, onReview, onRefresh }: DashboardFlashcardsProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const reviewingCard = dueCards.length > 0 ? dueCards[0] : null;

  const handleSkip = () => {
    setIsFlipped(false);
  };

  const getProseSizeClass = (text?: string) => {
    if (!text) return 'text-base';
    const len = text.length;
    if (len < 60) return 'text-2xl text-center font-black tracking-tight leading-tight';
    if (len < 120) return 'text-xl text-center font-bold tracking-tight';
    return 'text-base leading-relaxed';
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-2xl shadow-muted/5 bg-card/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-border/40">
      <CardHeader className="p-10 pb-4">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
               <Brain className="h-4 w-4" strokeWidth={3} />
               Active Queue
             </CardTitle>
             <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Spaced Repetition Engine</CardDescription>
           </div>
           {!loading && reviewingCard && (
             <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
               {dueCards.length} Cards
             </Badge>
           )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-10 pt-6 flex flex-col">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-10 w-10 relative">
                 <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                 <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-6">Neural Sync Active...</p>
            </motion.div>
          ) : reviewingCard ? (
            <motion.div
              key={reviewingCard.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col gap-8"
            >
              <div 
                className="relative h-[320px] perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div 
                  className="w-full h-full relative preserve-3d"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-muted/10 rounded-[2rem] p-10 flex flex-col items-center justify-center border border-border/50 shadow-inner group-hover:border-primary/30 transition-colors">
                    <Badge variant="outline" className="absolute top-6 left-6 text-[8px] uppercase font-black tracking-widest border-primary/20 text-primary/50">
                      {reviewingCard.deck}
                    </Badge>
                    <div className={`prose dark:prose-invert max-w-none text-foreground prose-img:rounded-2xl prose-img:max-h-32 ${getProseSizeClass(reviewingCard.front)}`}>
                      <ReactMarkdown>{reviewingCard.front}</ReactMarkdown>
                    </div>
                    <div className="absolute bottom-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                      <Eye className="h-3 w-3" /> Tap to reveal clinical data
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary rounded-[2rem] p-10 flex flex-col items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
                    <div className={`prose dark:prose-invert max-w-none text-primary-foreground prose-img:rounded-2xl prose-img:max-h-32 ${getProseSizeClass(reviewingCard.back)}`}>
                      <ReactMarkdown>{reviewingCard.back}</ReactMarkdown>
                    </div>
                    <div className="absolute bottom-6 text-[9px] font-black uppercase tracking-widest text-primary-foreground/50">Reference Standard Data</div>
                  </div>
                </motion.div>
              </div>

              {isFlipped ? (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  <Button 
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-muted/20 border-2 border-transparent hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive transition-all text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReview(reviewingCard.id, false);
                      setIsFlipped(false);
                    }}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" /> Retrieval Hard
                  </Button>
                  <Button 
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReview(reviewingCard.id, true);
                      setIsFlipped(false);
                    }}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" /> Recall Success
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                   <div className="h-0.5 w-12 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="h-full w-full bg-primary" 
                      />
                   </div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">System Awaiting Clinician Input</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-24 w-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center mb-10 rotate-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                <Brain className="h-10 w-10 text-emerald-500" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black tracking-tighter mb-2">Cycle Cleared</h3>
              <p className="text-xs text-muted-foreground font-medium mb-8 max-w-[200px] mx-auto leading-relaxed">Your professional memory pool is fully optimized for current protocols.</p>
              <Button variant="outline" size="lg" className="rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 h-12 px-8" onClick={onRefresh}>
                <RotateCcw className="h-4 w-4 mr-3" /> Re-sync Database
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <div className="px-10 pb-8 flex items-center justify-center opacity-20 pointer-events-none">
         <div className="flex items-center gap-2">
            <Command className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Memory Module Protocol v4.0</span>
         </div>
      </div>
    </Card>
  );
}

