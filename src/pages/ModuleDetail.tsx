import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_MODULES } from '@/src/data/mockData';
import ReactMarkdown from 'react-markdown';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Maximize2, 
  Minimize2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { PomodoroTimer } from '@/src/components/PomodoroTimer';
import { Progress } from '@/components/ui/progress';
import { StudyModule } from '@/src/types';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { toast } from 'sonner';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const { user, profile, updateProgress } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [module, setModule] = useState<StudyModule | null>(null);
  const [isLoadingModule, setIsLoadingModule] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    const unsubscribe = onSnapshot(doc(db, 'modules', moduleId), (snap) => {
      if (snap.exists()) {
        setModule({ id: snap.id, ...snap.data() } as StudyModule);
      }
      setIsLoadingModule(false);
    });
    return () => unsubscribe();
  }, [moduleId]);

  // Split content by ## headings or use explicit sections
  const sections = React.useMemo(() => {
    if (!module) return [];
    
    if (module.sections && module.sections.length > 0) {
      return [
        module.content, 
        ...module.sections.map(s => `## ${s.title}\n\n${s.content}`)
      ].filter(Boolean);
    }
    
    const parts = module.content?.split(/\n## /) || [];
    return parts.map((part, index) => {
      if (index === 0) return part;
      return '## ' + part;
    });
  }, [module]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !moduleId) return;
      
      try {
        const progressDoc = await getDoc(doc(db, 'users', user.uid, 'moduleProgress', moduleId));
        if (progressDoc.exists()) {
          const data = progressDoc.data();
          if (data.currentSection !== undefined) {
            setCurrentSection(data.currentSection);
            toast.info("Resuming from your last session");
          }
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [user, moduleId]);

  const saveProgress = async (sectionIndex: number) => {
    if (!user || !moduleId) return;
    
    const isLast = sectionIndex === sections.length - 1;
    const progressRef = doc(db, 'users', user.uid, 'moduleProgress', moduleId);
    
    try {
      await setDoc(progressRef, {
        moduleId,
        currentSection: sectionIndex,
        totalSections: sections.length,
        completed: isLast,
        lastReadAt: serverTimestamp(),
        ...(isLast ? { completedAt: serverTimestamp() } : {})
      }, { merge: true });

      if (isLast) {
        updateProgress(moduleId, 100);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, progressRef.path);
    }
  };

  if (!module) return <div className="p-8 text-center">Module not found</div>;

  const isCompleted = !!profile?.progress?.[module.id || ''];
  const progressPercentage = Math.round(((currentSection + 1) / sections.length) * 100);

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      const next = currentSection + 1;
      setCurrentSection(next);
      saveProgress(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    setCurrentSection(sections.length - 1);
    saveProgress(sections.length - 1);
    toast.success("Module marked as completed!");
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[100] bg-background overflow-y-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-300' : 'max-w-6xl mx-auto space-y-6 px-4 pb-20'}`}>
      {/* Progress Indicator */}
      {!isFullscreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-50 py-3 px-6 h-16 flex items-center justify-center">
            <div className="max-w-4xl w-full flex items-center gap-6">
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Module Progress</span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentSection === 0} className="rounded-xl font-bold">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    {currentSection === sections.length - 1 ? (
                        <Button 
                            variant={isCompleted ? "outline" : "default"} 
                            onClick={handleComplete}
                            disabled={isCompleted}
                            className={`rounded-xl font-bold ${isCompleted ? 'text-green-600 border-green-600' : ''}`}
                        >
                            {isCompleted ? "Completed" : "Finish Module"}
                        </Button>
                    ) : (
                        <Button variant="default" size="sm" onClick={handleNext} className="rounded-xl font-bold">
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
      )}

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background/50 p-2 rounded-full shadow-2xl border"
              >
                <div className="bg-background backdrop-blur-md rounded-full px-4 py-1.5 border flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hidden sm:flex">
                    <span>{currentSection + 1} / {sections.length}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercentage}%` }} />
                    </div>
                </div>
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

      <div className={isFullscreen ? 'max-w-4xl mx-auto pb-32' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">{module.title}</h1>
                <p className="text-base sm:text-lg text-muted-foreground font-medium flex items-center gap-2 mt-2">
                    <BookOpen className="h-4 w-4 text-primary" /> {module.category}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">Section {currentSection + 1} of {sections.length}</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="prose prose-slate dark:prose-invert max-w-none bg-background border p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] shadow-sm border-border/50 min-h-[500px] break-words select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <ReactMarkdown>{sections[currentSection]}</ReactMarkdown>
              
              {currentSection < sections.length - 1 && (
                <div className="mt-12 pt-12 border-t border-border flex justify-center">
                    <Button onClick={handleNext} className="rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-primary/20">
                        Continue to Next Section <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="bg-primary/5 border border-primary/20 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <GraduationCap className="h-32 w-32 rotate-12" />
            </div>
            <div className="space-y-2 text-center md:text-left relative z-10">
              <h3 className="text-xl font-extrabold italic tracking-tight">Mastered this topic?</h3>
              <p className="text-sm text-muted-foreground font-medium">Test your clinical retention with a focused assessment session.</p>
            </div>
            <Link to={`/quizzes?system=${module.category}`} className={buttonVariants({ variant: "default", size: "lg", className: "px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 relative z-10" })}>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Start Assessment
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
            
            <Card className="rounded-[32px] border-none bg-muted/30 shadow-none">
                <CardHeader className="p-6 pb-2">
                    <h4 className="text-sm font-black uppercase tracking-widest">Section List</h4>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-1">
                    {sections.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setCurrentSection(i);
                                saveProgress(i);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                                currentSection === i 
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>Section {i + 1}</span>
                            {i < currentSection && <CheckCircle2 className="h-3 w-3 opacity-50" />}
                        </button>
                    ))}
                </CardContent>
            </Card>

            <div className="p-8 rounded-[32px] bg-primary/5 border border-dashed border-primary/20">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-3">Deep Focus</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medum">
                We'll save your position automatically. Revisit this module anytime to resume right from Section {currentSection + 1}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

