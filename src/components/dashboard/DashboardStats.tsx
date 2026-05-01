import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Brain, CheckCircle2, Award, Zap, Target, BookOpenCheck, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStatsProps {
  completedModules: number;
  totalModules: number;
  dueCards: number;
  accuracy: number;
  sessions: number;
}

export function DashboardStats({ completedModules, totalModules, dueCards, accuracy, sessions }: DashboardStatsProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const item: Variants = {
    hidden: { scale: 0.95, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  const progressPercentage = (completedModules / (totalModules || 1)) * 100;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      <motion.div variants={item}>
        <Card className="border-none shadow-2xl shadow-primary/5 bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="flex flex-col h-full justify-between items-start space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                 <Target className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                   <div className="text-4xl font-black">{progressPercentage.toFixed(0)}%</div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Syllabus Completion</div>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-white/20" />
                <div className="flex justify-between items-center text-[10px] font-bold">
                   <span className="opacity-80 uppercase tracking-widest">{completedModules} Mastered</span>
                   <span className="opacity-80 uppercase tracking-widest">{totalModules} Total</span>
                </div>
              </div>
            </div>
            <Zap className="absolute -right-8 -top-8 h-32 w-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-muted/5 bg-card rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer border border-border/40">
          <Link to="/flashcards">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                   <Brain className="h-6 w-6 text-orange-500" />
                </div>
                <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                   Review Due
                </div>
              </div>
              <div className="space-y-1">
                 <div className="text-5xl font-black text-foreground tracking-tighter">{dueCards}</div>
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Active Memory Deck</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                 Sync Now <Zap className="h-3 w-3" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-muted/5 bg-card rounded-[2.5rem] overflow-hidden group border border-border/40">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                 <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                 High Precision
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                 <div className="text-5xl font-black text-foreground tracking-tighter">{accuracy}%</div>
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diagnostics Accuracy</div>
              </div>
              <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${accuracy}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-muted/5 bg-card rounded-[2.5rem] overflow-hidden group border border-border/40">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                 <Flame className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted text-[8px] flex items-center justify-center font-black">
                       V
                    </div>
                 ))}
              </div>
            </div>
            <div className="space-y-1">
               <div className="text-5xl font-black text-foreground tracking-tighter">{sessions}</div>
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Clinical Trials</div>
            </div>
            <Link to="/quizzes">
               <Button variant="ghost" className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 hover:bg-muted/50">
                  Execute Review
               </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

