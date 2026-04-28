import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_MODULES } from '@/src/data/mockData';
import ReactMarkdown from 'react-markdown';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChevronLeft, GraduationCap, CheckCircle2, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { PomodoroTimer } from '@/src/components/PomodoroTimer';
import { useState } from 'react';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const { profile, updateProgress } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const module = MOCK_MODULES.find(m => m.id === moduleId);

  if (!module) return <div className="p-8 text-center">Module not found</div>;

  const isCompleted = !!profile?.progress?.[module.id || ''];

  const handleComplete = () => {
    if (module.id) updateProgress(module.id, 100);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[100] bg-background overflow-y-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-300' : 'max-w-6xl mx-auto space-y-8 px-4'}`}>
      <div className={`flex items-center justify-between mb-4 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {!isFullscreen && (
            <>
              <Link to="/modules" className="hover:text-primary flex items-center">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Modules
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">{module.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isFullscreen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
              >
                <PomodoroTimer variant="subtle" />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-full h-9 w-9 p-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={isFullscreen ? 'max-w-4xl mx-auto pb-20' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{module.title}</h1>
                <p className="text-lg text-muted-foreground">{module.category}</p>
              </div>
              <Button 
                variant={isCompleted ? "outline" : "default"} 
                onClick={handleComplete}
                disabled={isCompleted}
                className={isCompleted ? "text-green-600 border-green-600 font-bold" : "font-bold"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isCompleted ? "Course Completed" : "Mark as Complete"}
              </Button>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none bg-background border p-6 md:p-10 rounded-3xl shadow-sm border-border/50">
            <ReactMarkdown>{module.content}</ReactMarkdown>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold italic tracking-tight">Ready to test your knowledge?</h3>
              <p className="text-sm text-muted-foreground">Go to the Assessments section to configure a focused quiz session based on this system.</p>
            </div>
            <Link to={`/quizzes?system=${module.category}`} className={buttonVariants({ variant: "default", size: "lg", className: "px-8 rounded-xl font-bold shadow-lg shadow-primary/20" })}>
                <GraduationCap className="mr-2 h-5 w-5" /> Full Assessment
            </Link>
          </div>
        </motion.div>

        <div className={isFullscreen ? "hidden" : "lg:col-span-4 space-y-6 sticky top-8"}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Study Buddy</h3>
            </div>
            <PomodoroTimer />
            
            <div className="p-6 rounded-3xl bg-muted/30 border border-dashed border-muted-foreground/20">
              <h4 className="text-sm font-bold mb-2">Deep Focus Mode</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the Pomodoro technique to maintain high cognitive performance. 25 minutes of intense study followed by a 5-minute cognitive reset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
