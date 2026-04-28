import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, GraduationCap, AlertCircle, TrendingUp, Timer as TimerIcon } from 'lucide-react';
import { toast } from 'sonner';
import { QuizSession } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showResult && session) {
      const finalPercentage = Math.round((score / session.questions.length) * 100);
      updateQuizStats(finalPercentage, session.questions.length, score);
      
      // Save to history
      if (user) {
        const path = `users/${user.uid}/quizHistory`;
        const newDocRef = doc(collection(db, 'users', user.uid, 'quizHistory'));
        setDoc(newDocRef, {
          score: finalPercentage,
          total: session.questions.length,
          correct: score,
          timestamp: serverTimestamp(),
          config: session.config,
          system: session.config.system,
          species: session.config.species
        }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `${path}/${newDocRef.id}`);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) return <div className="flex justify-center items-center h-64">Loading session...</div>;

  const currentQuestion = session.questions[currentStep];
  const progressPercentage = ((currentStep + 1) / session.questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    
    // In timed exams, we don't show result immediately to simulate realistic exam
    if (session?.config.isTimed) {
      if (selectedOption === currentQuestion.correctAnswer) {
        setScore(score + 1);
      }
      handleNext();
      return;
    }

    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
      toast.success("Correct!");
    } else {
      toast.error("Incorrect choice.");
    }
  };

  const handleNext = () => {
    if (currentStep < session!.questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
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
      <div className="max-w-3xl mx-auto space-y-8 pt-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border shadow-xl overflow-hidden"
        >
          <div className="bg-primary/5 p-8 text-center border-b">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-4 animate-bounce">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Quiz Complete!</h1>
            <p className="text-muted-foreground mt-2">You've finished the {session.questions.length} question challenge.</p>
          </div>

          <div className="p-8 grid md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * finalPercentage) / 100}
                    className="text-primary transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{finalPercentage}%</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Score</span>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Correct</span>
                </div>
                <div className="text-2xl font-bold">{correctCount}</div>
                <p className="text-xs text-muted-foreground">Answers verified</p>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Incorrect</span>
                </div>
                <div className="text-2xl font-bold">{incorrectCount}</div>
                <p className="text-xs text-muted-foreground">Room for growth</p>
              </div>

              <div className="col-span-2 bg-primary/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary/70">Performance Level</p>
                  <p className="font-semibold">
                    {finalPercentage >= 90 ? "Excellent Mastery!" : 
                     finalPercentage >= 70 ? "Good Job!" : 
                     finalPercentage >= 50 ? "Solid Effort" : "Keep Practicing"}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary/50" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/20 border-t flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/quizzes')} variant="default" className="w-full sm:w-auto h-12 px-6 rounded-xl">Try Another Quiz</Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl">Back to Dashboard</Button>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-xl">Detailed Review</h3>
            <Badge variant="outline">{session.questions.length} Questions</Badge>
          </div>
          <div className="grid gap-4">
            {session.questions.map((q, idx) => (
              <Card key={idx} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 bg-primary/10 w-full" />
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="space-y-3">
                      <p className="font-medium text-lg leading-snug">{q.question}</p>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-700 dark:text-green-400 font-semibold flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Correct Answer: {q.options[q.correctAnswer]}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 text-sm italic relative">
                        <span className="absolute -top-2 left-4 px-2 bg-background rounded text-[10px] font-bold text-muted-foreground uppercase">Explanation</span>
                        <p className="text-muted-foreground">{q.explanation}</p>
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
    <div className={`max-w-3xl mx-auto space-y-8 ${session.config.isTimed ? 'pt-12' : ''}`}>
      {session.config.isTimed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/10 border-b border-destructive/20 backdrop-blur-md px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Realistic Exam Simulation</span>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              <TimerIcon className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-[10px] font-bold text-muted-foreground">
            Progress: {Math.round(progressPercentage)}%
          </div>
        </div>
      )}

      <div className="flex justify-between items-end gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              Question {currentStep + 1} of {session.questions.length}
              {timeLeft !== null && (
                <Badge variant="outline" className={`ml-2 font-mono ${timeLeft < 60 ? 'text-red-500 border-red-500 animate-pulse' : 'text-amber-500 border-amber-500'}`}>
                  <TimerIcon className="h-3 w-3 mr-1" />
                  {formatTime(timeLeft)}
                </Badge>
              )}
            </span>
            <span className="font-medium text-primary">Score: {score}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleAbort()}>
          Abort
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold leading-tight">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
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
                      className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                        status === "correct" ? "bg-green-50 border-green-500 text-green-900" :
                        status === "incorrect" ? "bg-red-50 border-red-500 text-red-900" :
                        status === "selected" ? "border-primary bg-primary/5 text-primary" :
                        "bg-background hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                      {status === "correct" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {status === "incorrect" && <XCircle className="h-5 w-5 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-lg bg-muted text-sm border-l-4 border-primary"
                >
                  <p className="font-bold mb-1">Explanation:</p>
                  <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end p-6 bg-muted/5 border-t">
              {!isAnswered && !session.config.isTimed ? (
                <Button size="lg" className="px-8" onClick={handleConfirmAnswer} disabled={selectedOption === null}>
                  Submit Answer
                </Button>
              ) : session.config.isTimed ? (
                <Button size="lg" className="px-8 flex items-center bg-destructive hover:bg-destructive/90" onClick={handleConfirmAnswer} disabled={selectedOption === null}>
                  {currentStep < session.questions.length - 1 ? 'Save & Next' : 'Finish Exam'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button size="lg" className="px-8 flex items-center" onClick={handleNext}>
                  {currentStep < session.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
