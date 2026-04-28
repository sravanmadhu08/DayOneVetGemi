import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Timer as TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

type TimerMode = 'work' | 'break';

interface PomodoroTimerProps {
  variant?: 'default' | 'subtle';
}

export function PomodoroTimer({ variant = 'default' }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    setIsActive(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play sound or notify
      if (Notification.permission === 'granted') {
         new Notification(mode === 'work' ? 'Time for a break!' : 'Back to work!');
      }
      switchMode(mode === 'work' ? 'break' : 'work');
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, switchMode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (variant === 'subtle') {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border rounded-full shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[8px] px-1.5 h-4 uppercase font-black tracking-widest ${mode === 'work' ? 'border-primary/20 text-primary' : 'border-amber-500/20 text-amber-500'} bg-background`}>
            {mode}
          </Badge>
          <div className="text-sm font-bold font-mono min-w-[45px]">
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={toggleTimer}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetTimer}
            className="h-8 w-8 rounded-full"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex gap-1">
           <button 
             onClick={() => switchMode('work')}
             className={`p-1.5 rounded-full transition-colors ${mode === 'work' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
           >
             <BookOpen className="h-3 w-3" />
           </button>
           <button 
             onClick={() => switchMode('break')}
             className={`p-1.5 rounded-full transition-colors ${mode === 'break' ? 'bg-amber-500 text-white' : 'hover:bg-muted'}`}
           >
             <Coffee className="h-3 w-3" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-background/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex bg-muted p-1 rounded-xl w-full">
            <button
              onClick={() => switchMode('work')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                mode === 'work' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-3 w-3" /> Focus
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                mode === 'break' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Coffee className="h-3 w-3" /> Break
            </button>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <motion.div
              key={timeLeft}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black font-mono tracking-tighter"
            >
              {formatTime(timeLeft)}
            </motion.div>
            
            <div className="absolute -top-3 -right-4">
               <Badge variant="outline" className="text-[8px] px-1.5 h-4 uppercase font-black tracking-widest border-primary/20 text-primary bg-background">
                 {mode}
               </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full">
            <Button
              onClick={toggleTimer}
              size="sm"
              className={`flex-1 font-bold h-9 rounded-lg transition-all text-xs ${
                isActive 
                  ? 'bg-muted text-foreground hover:bg-muted/80' 
                  : mode === 'work' ? 'bg-primary' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3.5 w-3.5" /> Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-9 w-9 rounded-lg border-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
