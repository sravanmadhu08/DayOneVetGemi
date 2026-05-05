import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, GraduationCap, AlertCircle, TrendingUp, Timer as TimerIcon, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { QuizSession, Question as QuestionType } from '@/src/types';
import { api } from '@/src/lib/api';
import { FileText, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuizDetail() {
  const navigate = useNavigate();
  const { updateQuizStats, user } = useAuth();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [sourcePdf, setSourcePdf] = useState<any | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  
  // Custom navigation blocker
  useEffect(() => {
    if (!session || showResult || isAborted) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.target !== '_blank') {
        try {
          const url = new URL(anchor.href);
          const isInternal = url.origin === window.location.origin && url.pathname !== '/quizzes/session';
          if (isInternal) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNav(url.pathname + url.search + url.hash);
          }
        } catch {
          // ignore invalid URLs
        }
      }
    };
    
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [session, showResult, isAborted]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showResult && session) {
      const finalPercentage = Math.round((score / session.questions.length) * 100);
      updateQuizStats(finalPercentage, session.questions.length, score);
      
      // Save to history (Django API)
      if (user) {
        api.submitQuizAttempt({
          score: finalPercentage,
          total_questions: session.questions.length,
          correct_count: score,
          system: String(session.config.system),
          species: String(session.config.species),
          quiz_config: session.config
        }).catch(err => {
          console.error("Failed to save quiz attempt:", err);
          toast.error("Failed to save quiz results to your history");
        });
      }
      
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [showResult]);

  useEffect(() => {
    const savedSession = sessionStorage.getItem('vet_quiz_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession) as QuizSession;
      setSession(parsed);
      
      if (parsed.config.isTimed && parsed.config.duration) {
        setTimeLeft(parsed.config.duration);
      }
    } else {
      navigate('/quizzes');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !showResult && !isAborted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timerRef.current!);
            setShowResult(true);
            toast.error("Time is up!");
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft === null, showResult, isAborted]);

  useEffect(() => {
    const fetchSourcePdf = async () => {
      if (session && session.questions[currentStep]?.sourceId) {
        try {
          const id = session.questions[currentStep].sourceId;
          const data = await api.getDocument(id!);
          setSourcePdf(data);
        } catch (err) {
          console.error("Failed to fetch source PDF:", err);
          setSourcePdf(null);
        }
      } else {
        setSourcePdf(null);
      }
    };
    fetchSourcePdf();
  }, [currentStep, session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [answeredState, setAnsweredState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelectedOption(selections[currentStep] ?? null);
    setIsAnswered(answeredState[currentStep] ?? false);
  }, [currentStep]);

  if (!session) return <div className="flex justify-center items-center h-64">Loading session...</div>;

  const currentQuestion = session?.questions[currentStep];
  const progressPercentage = session ? ((currentStep + 1) / session.questions.length) * 100 : 0;

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setSelections(prev => ({ ...prev, [currentStep]: index }));
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    
    // In timed exams, we don't show result immediately to simulate realistic exam
    if (session?.config.isTimed) {
      if (selectedOption === currentQuestion!.correctAnswer && !answeredState[currentStep]) {
        setScore(score + 1);
      }
      setAnsweredState(prev => ({ ...prev, [currentStep]: true }));
      handleNext();
      return;
    }

    if (!answeredState[currentStep]) {
      const isCorrect = selectedOption === currentQuestion!.correctAnswer;
      if (isCorrect) {
        setScore(score + 1);
        toast.success("Correct!");

        // Save correctly answered practice question (Django API)
        if (!session?.config.isTimed && user && currentQuestion!.id) {
          api.saveCompletedPracticeQuestion({
            question: currentQuestion!.id,
            was_correct: true
          }).catch(err => {
            console.error("Failed to save practice question completion:", err);
          });
        }
      } else {
        toast.error("Incorrect choice.");
        // Optional: save incorrect attempts too
        if (!session?.config.isTimed && user && currentQuestion!.id) {
          api.saveCompletedPracticeQuestion({
            question: currentQuestion!.id,
            was_correct: false
          }).catch(err => {
            console.error("Failed to save practice question completion:", err);
          });
        }
      }
    }
    setIsAnswered(true);
    setAnsweredState(prev => ({ ...prev, [currentStep]: true }));
  };

  const handleNext = () => {
    if (currentStep < session!.questions.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowResult(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAbort = (save: boolean = false) => {
    if (save) {
      const answeredCount = isAnswered ? currentStep + 1 : currentStep;
      if (answeredCount > 0 && session) {
        const percentage = Math.round((score / answeredCount) * 100);
        updateQuizStats(percentage, answeredCount, score);
        toast.success("Progress saved.");
      }
      navigate('/quizzes');
    } else {
      setIsAborted(true);
    }
  };

  if (isAborted) {
    const answeredCount = isAnswered ? currentStep + 1 : currentStep;
    return (
      <div className="max-w-md mx-auto pt-20">
        <Card className="border-destructive/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle>Quit Quiz?</CardTitle>
            <p className="text-sm text-muted-foreground">
              You have answered {answeredCount} out of {session.questions.length} questions.
            </p>
          </CardHeader>
          <CardFooter className="flex-col gap-2">
            {answeredCount > 0 && (
              <Button variant="default" className="w-full" onClick={() => handleAbort(true)}>
                Save Stats & Quit
              </Button>
            )}
            <Button variant="destructive" className="w-full" onClick={() => navigate('/quizzes')}>
              Discard & Quit
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsAborted(false)}>
              Keep Going
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showResult) {
    const finalPercentage = Math.round((score / session.questions.length) * 100);
    const correctCount = score;
    const incorrectCount = session.questions.length - score;
    
    return (
      <div className="max-w-5xl mx-auto space-y-8 pt-6 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-[48px] border border-border/50 shadow-2xl overflow-hidden"
        >
          <div className="bg-muted/30 p-8 sm:p-10 text-center border-b border-border/50 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
               <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex p-6 rounded-[32px] bg-primary/10 mb-4 ring-8 ring-primary/5">
                <GraduationCap className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tightest uppercase italic">Diagnostic.<span className="not-italic opacity-40">SUMMARY</span></h1>
                <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Protocol successfully terminated & indexed</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Score Gauge */}
            <div className="lg:col-span-4 flex flex-col items-center space-y-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96" cy="96" r="88"
                    stroke="currentColor" strokeWidth="12"
                    fill="transparent" className="text-muted/20"
                  />
                  <motion.circle
                    cx="96" cy="96" r="88"
                    stroke="currentColor" strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={552.9}
                    initial={{ strokeDashoffset: 552.9 }}
                    animate={{ strokeDashoffset: 552.9 - (552.9 * finalPercentage) / 100 }}
                    className="text-primary"
                    strokeLinecap="round"
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black tracking-tighter">{finalPercentage}%</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Accuracy Index</span>
                </div>
              </div>
              <div className="text-center">
                 <p className="text-xl font-bold italic tracking-tight uppercase">
                    {finalPercentage >= 90 ? "Superior Mastery" : 
                     finalPercentage >= 70 ? "Qualified Performance" : 
                     finalPercentage >= 50 ? "Developing Competency" : "Critical Review Required"}
                 </p>
              </div>
            </div>

            {/* Right: Metrics Matrix */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/20 p-6 sm:p-8 rounded-[32px] border border-border/50 flex flex-col justify-between h-auto sm:h-40 min-h-[120px]">
                <div className="flex items-center gap-2 text-green-600 mb-2 sm:mb-0">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Validated Correct</span>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tighter">{correctCount}</div>
                  <p className="text-xs text-muted-foreground font-medium">Cases correctly diagnosed</p>
                </div>
              </div>

              <div className="bg-muted/20 p-6 sm:p-8 rounded-[32px] border border-border/50 flex flex-col justify-between h-auto sm:h-40 min-h-[120px]">
                <div className="flex items-center gap-2 text-rose-600 mb-2 sm:mb-0">
                  <XCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Diagnostic Gaps</span>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tighter">{incorrectCount}</div>
                  <p className="text-xs text-muted-foreground font-medium">Opportunities for refinement</p>
                </div>
              </div>

              <div className="sm:col-span-2 bg-primary/5 p-6 sm:p-8 rounded-[32px] border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Session Intelligence</p>
                  <p className="font-bold text-base sm:text-lg leading-tight uppercase italic opacity-80">
                    Calculated efficiency: {(correctCount / (session.questions.length || 1)).toFixed(2)} pts/case
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary opacity-20" />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-muted/30 border-t flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/quizzes')} variant="default" className="w-full sm:w-auto h-14 px-10 rounded-2xl text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/10">Re-initiate Selection</Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl text-lg font-black uppercase tracking-tight border-2">Return to Command</Button>
          </div>
        </motion.div>

        {/* Audit Log (Review) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-muted/30 p-6 rounded-3xl border border-border/50">
            <h3 className="font-black text-2xl uppercase italic">Diagnostic.<span className="not-italic opacity-40">LOG</span></h3>
            <Badge variant="secondary" className="px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
              {session.questions.length} AUDIT NODES
            </Badge>
          </div>
          
          <div className="grid gap-6">
            {session.questions.map((q, idx) => (
              <Card key={idx} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group rounded-[32px] bg-background border border-border/50">
                <CardContent className="p-8 space-y-6">
                  <div className="flex gap-6">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted flex items-center justify-center font-black text-lg transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="space-y-6 flex-1">
                      <p 
                        className="font-bold text-xl leading-tight text-foreground/80 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        {q.question}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                          <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Verified Diagnosis</p>
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">
                            {q.options[q.correctAnswer]}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 italic">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Clinical Rationale</p>
                          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 pb-20 px-4 ${session.config.isTimed ? 'pt-12' : 'pt-6'}`}>
      {session.config.isTimed && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-rose-50/90 border-b border-rose-200 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600">Protocol: Active Exam Simulation</span>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-3 font-mono text-xl font-black ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-primary'}`}>
              <TimerIcon className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">
               Vector: {session.config.system}
             </div>
             <div className="h-4 w-px bg-border hidden sm:block" />
             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
               Index: {currentStep + 1} / {session.questions.length}
             </div>
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-8 rounded-xl px-3 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10"
               onClick={() => handleAbort()}
             >
               Terminate
             </Button>
          </div>
        </div>
      )}

      {/* Case Header & Progress */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="outline" className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${session.config.isTimed ? 'border-rose-400 text-rose-600 bg-rose-50' : 'border-primary text-primary bg-primary/5'}`}>
              {session.config.isTimed ? 'Board Simulation' : 'Modular Learning'}
            </Badge>
            <h2 className="text-3xl font-black tracking-tightest uppercase italic">
              Case.<span className="not-italic opacity-40">STUDY</span> 
              <span className="ml-3 text-primary not-italic">#{(currentStep + 1).toString().padStart(3, '0')}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
             <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 opacity-70" />
                <span>{session.config.species} / {session.config.system}</span>
             </div>
             {!session.config.isTimed && (
               <div className="px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20">
                 Efficiency: {Math.round(score / (currentStep + 1 || 1) * 100)}%
               </div>
             )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Session Completion</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className={`h-full transition-all duration-500 ${session.config.isTimed ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.4)]'}`} 
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-3xl mx-auto"
        >
          {/* Question Display */}
          <div className="w-full space-y-4">
            <Card className="border-none shadow-2xl bg-background rounded-[32px] overflow-hidden border border-border/30">
              <CardHeader className="bg-muted/30 p-6 lg:p-8 border-b">
                <CardTitle 
                  className="text-lg md:text-xl font-semibold leading-relaxed text-foreground select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 space-y-6">
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    let status = "idle";
                    if (isAnswered) {
                      if (idx === currentQuestion.correctAnswer) status = "correct";
                      else if (idx === selectedOption) status = "incorrect";
                    } else if (selectedOption === idx) {
                      status = "selected";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleOptionSelect(idx)}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className={`group w-full text-left p-6 rounded-3xl border-2 transition-all flex justify-between items-center relative overflow-hidden select-none ${
                          status === "correct" ? "bg-green-500/10 border-green-500 text-green-900 dark:text-green-400" :
                          status === "incorrect" ? "bg-destructive/10 border-destructive text-destructive" :
                          status === "selected" ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-xl shadow-primary/10" :
                          "bg-background border-border/50 hover:border-primary/50 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-4 z-10">
                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${
                            status === "correct" ? "bg-green-500 text-white" :
                            status === "incorrect" ? "bg-destructive text-white" :
                            status === "selected" ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="font-semibold text-base">{option}</span>
                        </div>
                        
                        <div className="z-10">
                          {status === "correct" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                          {status === "incorrect" && <XCircle className="h-6 w-6 text-destructive" />}
                        </div>

                        {status === "selected" && !isAnswered && (
                          <motion.div 
                            layoutId="selection-glow"
                            className="absolute inset-0 bg-primary/5 z-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 overflow-hidden"
                    >
                      <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/20 relative">
                         <div className="absolute -top-3 left-8 px-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full">
                           Pathophysiology Explanation
                         </div>
                         <p className="text-base text-foreground/80 leading-relaxed italic">
                           {currentQuestion.explanation}
                         </p>
                         {sourcePdf && (
                            <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between">
                               <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                  <FileText className="h-4 w-4" />
                                  <span>Reference: {sourcePdf.title}</span>
                               </div>
                               <Button 
                                 variant="link" 
                                 size="sm" 
                                 className="text-[10px] font-black uppercase text-primary h-auto p-0"
                                 onClick={async () => {
                                   if (!sourcePdf.url) return;
                                   if (sourcePdf.url.startsWith('data:')) {
                                     const res = await fetch(sourcePdf.url);
                                     const blob = await res.blob();
                                     const blobUrl = URL.createObjectURL(blob);
                                     const a = document.createElement('a');
                                     a.href = blobUrl;
                                     a.download = `${sourcePdf.title}.pdf`;
                                     document.body.appendChild(a);
                                     a.click();
                                     document.body.removeChild(a);
                                     URL.revokeObjectURL(blobUrl);
                                   } else {
                                     window.open(sourcePdf.url, '_blank', 'noopener,noreferrer');
                                   }
                                 }}
                               >
                                 View Source <ExternalLink className="h-3 w-3 ml-1" />
                               </Button>
                            </div>
                         )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              <CardFooter className="p-6 lg:p-8 pt-0 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost"
                    size="lg"
                    className="h-14 px-6 rounded-2xl text-lg font-bold text-muted-foreground hover:bg-muted/50 uppercase tracking-tight"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || isAnswered}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="ghost"
                    size="lg"
                    className="h-14 px-6 rounded-2xl text-lg font-bold text-muted-foreground hover:bg-muted/50 uppercase tracking-tight"
                    onClick={handleNext}
                    disabled={isAnswered}
                  >
                    Skip Case
                  </Button>
                </div>

                <div className="flex gap-4">
                  {!isAnswered && !session.config.isTimed ? (
                    <Button 
                      size="lg" 
                      className="h-14 px-8 rounded-2xl text-base font-black bg-primary shadow-xl shadow-primary/20 uppercase tracking-tight" 
                      onClick={handleConfirmAnswer} 
                      disabled={selectedOption === null}
                    >
                      Validate Diagnosis
                    </Button>
                  ) : session.config.isTimed ? (
                    <Button 
                      size="lg" 
                      className="h-14 px-8 rounded-2xl text-base font-black bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/20 uppercase tracking-tight flex items-center group" 
                      onClick={handleConfirmAnswer} 
                      disabled={selectedOption === null}
                    >
                      {currentStep < session.questions.length - 1 ? 'Commit Answer' : 'Submit Final Script'}
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="h-14 px-8 rounded-2xl text-base font-black bg-foreground text-background shadow-xl uppercase tracking-tight flex items-center group" 
                      onClick={handleNext}
                    >
                      {currentStep < session.questions.length - 1 ? 'Next Case' : 'Finalize Session'}
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <AlertDialog open={!!pendingNav} onOpenChange={(open) => !open && setPendingNav(null)}>
        <AlertDialogContent className="rounded-[32px] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Quit Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              You are navigating away from an active exam. Your progress may be lost. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:items-center sm:justify-between flex-row gap-2">
            <AlertDialogCancel className="mt-0 h-12 flex-1 rounded-2xl font-bold border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="h-12 flex-1 rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingNav) {
                   window.location.href = pendingNav;
                }
              }}
            >
              Quit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
