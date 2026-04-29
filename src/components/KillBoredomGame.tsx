import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCcw, Bone, Cat, Dog, Rabbit, Bird, Fish, Mouse, Snail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS = [Bone, Cat, Dog, Rabbit, Bird, Fish, Mouse, Snail];
const DECK = [...ICONS, ...ICONS].map((Icon, idx) => ({ id: idx, Icon }));

export function KillBoredomGame() {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    shuffleCards();
  }, []);

  const shuffleCards = () => {
    const shuffled = [...DECK].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setDisabled(false);
  };

  const handleClick = (index: number) => {
    if (disabled || flipped.includes(index) || solved.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves(m => m + 1);
      const firstIndex = newFlipped[0];
      const secondIndex = newFlipped[1];
      
      if (cards[firstIndex].Icon === cards[secondIndex].Icon) {
        setSolved(prev => [...prev, firstIndex, secondIndex]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const isWin = solved.length === DECK.length && DECK.length > 0;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-[48px] border border-border">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">Vet Memory Match</h2>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest max-w-sm mx-auto">
           Find matching pairs of veterinary icons. Complete it in the fewest moves possible!
        </p>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest pt-4">
           Moves: <span className="text-primary font-black">{moves}</span>
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-8">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index);
          return (
             <div 
               key={index} 
               className="relative w-16 h-16 sm:w-20 sm:h-20"
               onClick={() => handleClick(index)}
             >
                <div className={`w-full h-full cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                   <div className="absolute inset-0 bg-primary/10 rounded-2xl border-2 border-primary/20 [backface-visibility:hidden] flex items-center justify-center hover:bg-primary/20">
                     <Cat className="h-6 w-6 text-primary/20" />
                   </div>
                   <div className="absolute inset-0 bg-background rounded-2xl border-2 border-primary shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center text-primary">
                     <card.Icon className={`h-8 w-8 transition-transform duration-300 ${solved.includes(index) ? 'scale-110 text-green-500' : ''}`} />
                   </div>
                </div>
             </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isWin && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }} 
             animate={{ opacity: 1, y: 0 }}
             className="text-center space-y-4 mb-6"
           >
              <h3 className="text-2xl font-black text-green-500 uppercase tracking-widest">Amazing Memory!</h3>
              <p className="text-sm text-foreground/80 font-bold">You completed it in {moves} moves.</p>
           </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={shuffleCards} variant={isWin ? "default" : "outline"} className="rounded-full px-8 h-12 font-black uppercase text-xs tracking-widest gap-2 shadow-lg">
         <RefreshCcw className="h-4 w-4" /> {isWin ? 'Play Again' : 'Restart'}
      </Button>
    </div>
  );
}
