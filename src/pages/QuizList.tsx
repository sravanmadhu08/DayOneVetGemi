import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Info, Zap, Stethoscope, BookMarked, ChevronRight, Upload } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { QUESTION_POOL } from '@/src/data/mockData';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Question } from '@/src/types';
import { useAuth } from '@/src/hooks/useAuth';

export default function QuizList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isTimedInitial = searchParams.get('type') === 'timed';

  const [species, setSpecies] = useState<string>('All');
  const [system, setSystem] = useState<string>('All');
  const [isTimed, setIsTimed] = useState(isTimedInitial);
  const [countSelection, setCountSelection] = useState<string>(isTimed ? '60' : '10');
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchCustomQuestions = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'questions'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const questions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        setCustomQuestions(questions);
      } catch (err) {
        console.error('Error fetching custom questions:', err);
      }
    };
    fetchCustomQuestions();
  }, [user]);

  const speciesOptions = ['All', ...new Set([...QUESTION_POOL, ...customQuestions].flatMap(q => q.species))];
  const systemOptions = ['All', ...new Set([...QUESTION_POOL, ...customQuestions].map(q => q.system))];

  const availableQuestions = React.useMemo(() => {
    const pool = [...QUESTION_POOL, ...customQuestions];
    return pool.filter(q => {
      const speciesMatch = species === 'All' || q.species.includes(species);
      const systemMatch = system === 'All' || q.system === system;
      return speciesMatch && systemMatch;
    });
  }, [species, system, customQuestions]);

  const countOptions = ['5', '10', '20', '50', '60', '100', 'All'];

  const getActualCount = () => {
    if (countSelection === 'All') return availableQuestions.length;
    return Math.min(parseInt(countSelection), availableQuestions.length);
  };

  const handleStart = () => {
    const count = getActualCount();
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    sessionStorage.setItem('vet_quiz_session', JSON.stringify({
      questions: selected,
      config: { 
        species, 
        system, 
        count: selected.length,
        isTimed,
        duration: isTimed ? count * 120 : null, // 2 minutes per question for professional exam
      }
    }));
    
    navigate('/quizzes/session');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-muted p-1 rounded-full flex gap-1 border shadow-inner">
            <button
              onClick={() => setIsTimed(false)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${!isTimed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => {
                setIsTimed(true);
                setCountSelection('60');
              }}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${isTimed ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              Exam Simulation
            </button>
          </div>
        </div>

        <Badge variant="outline" className={`px-4 py-1 border-primary/20 bg-primary/5 text-primary mb-2 ${isTimed ? 'text-destructive border-destructive/20 bg-destructive/5' : ''}`}>
          {isTimed ? 'REALISTIC EXAM SIMULATION' : 'FOCUSED PRACTICE MODE'}
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {isTimed ? 'Comprehensive Board Exam' : 'Knowledge Assessment'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isTimed 
            ? '60 Minutes. 60 Questions. No immediate feedback.' 
            : 'Customizable sessions with instant feedback and explanations.'}
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-3 gap-6"
      >
        <motion.div variants={item} className="md:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-xl overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${isTimed ? 'bg-amber-500' : 'bg-primary'}`} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Session Build
              </CardTitle>
              <CardDescription>Select your focus area and intensity level.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 opacity-70" /> Species Domain
                  </Label>
                  <Select value={species} onValueChange={setSpecies}>
                    <SelectTrigger className="h-11 bg-muted/30 border-none transition-colors hover:bg-muted/50">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {speciesOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <BookMarked className="h-4 w-4 opacity-70" /> Clinical System
                  </Label>
                  <Select value={system} onValueChange={setSystem}>
                    <SelectTrigger className="h-11 bg-muted/30 border-none transition-colors hover:bg-muted/50">
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {systemOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {countOptions.map(opt => (
                  <Button 
                    key={opt}
                    variant={countSelection === opt ? "default" : "outline"}
                    className="h-10 text-xs font-bold transition-all"
                    onClick={() => setCountSelection(opt)}
                    disabled={opt !== 'All' && parseInt(opt) > availableQuestions.length && availableQuestions.length > 0}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              <div className="p-4 bg-background rounded-xl border space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Matching Items</span>
                  <span className="font-bold">{availableQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span className="font-bold">{getActualCount() * (isTimed ? 1 : 2)} min</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-14 text-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group uppercase tracking-tight"
                disabled={availableQuestions.length === 0}
                onClick={handleStart}
              >
                Assemble
                <ChevronRight className="ml-1 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-none bg-muted/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <Info className="h-3 w-3" />
                Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[10px] leading-relaxed text-muted-foreground">
              Sessions are generated from the validated clinical pool. Timed exams mimic BCSE and NAVLE formats. Results are tracked in your professional profile.
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {availableQuestions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center text-destructive text-sm font-bold bg-destructive/10 p-6 rounded-2xl border-2 border-dashed border-destructive/20"
          >
            CRITICAL: No matching clinical cases in the encrypted pool. 
            <p className="text-xs font-normal mt-1 opacity-70 underline cursor-pointer" onClick={() => {setSpecies('All'); setSystem('All');}}>Reset filters to default</p>
            <div className="mt-4">
              <Link 
                to="/import" 
                className={buttonVariants({ variant: "outline", className: "border-destructive/30 hover:bg-destructive/20" })}
              >
                Bulk Import New Data
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
