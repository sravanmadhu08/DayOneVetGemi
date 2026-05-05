import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Info,
  Zap,
  Stethoscope,
  BookMarked,
  ChevronRight,
  Upload,
  Timer as TimerIcon,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/src/lib/api";
import { Question } from "@/src/types";
import { useAuth } from "@/src/hooks/useAuth";
import { toast } from "sonner";

export default function QuizList() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isTimedInitial = searchParams.get("type") === "timed";

  const [species, setSpecies] = useState<string>("All");
  const [system, setSystem] = useState<string>("All");
  const [isTimed, setIsTimed] = useState(isTimedInitial);
  const [reviewMode, setReviewMode] = useState(false);
  const [countSelection, setCountSelection] = useState<string>(
    isTimed ? "60" : "10",
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>(
    [],
  );
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [qs, completed] = await Promise.all([
          api.getQuestions(),
          api.getCompletedPracticeQuestions(),
        ]);
        setQuestions(qs);
        setCompletedQuestionIds(completed.map((c) => String(c.question)));
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
        toast.error("Failed to load quiz questions");
      }
    };

    fetchData();
  }, [user]);

  const pool = questions;

  const completedQuestionSet = React.useMemo(
    () => new Set(completedQuestionIds),
    [completedQuestionIds],
  );

  const {
    speciesOptions,
    systemOptions,
    speciesTotalCounts,
    speciesRemainingCounts,
    systemTotalCounts,
    systemRemainingCounts,
    totalRemainingCount,
  } = React.useMemo(() => {
    const speciesTotals = new Map<string, number>();
    const speciesRemaining = new Map<string, number>();
    const systemTotals = new Map<string, number>();
    const systemRemaining = new Map<string, number>();
    let remaining = 0;

    pool.forEach((q) => {
      const isRemaining = !completedQuestionSet.has(q.id || "");
      if (isRemaining) remaining += 1;

      q.species.filter(Boolean).forEach((sp) => {
        speciesTotals.set(sp, (speciesTotals.get(sp) || 0) + 1);
        if (isRemaining) {
          speciesRemaining.set(sp, (speciesRemaining.get(sp) || 0) + 1);
        }
      });

      if (q.system) {
        systemTotals.set(q.system, (systemTotals.get(q.system) || 0) + 1);
        if (isRemaining) {
          systemRemaining.set(q.system, (systemRemaining.get(q.system) || 0) + 1);
        }
      }
    });

    return {
      speciesOptions: ["All", ...Array.from(speciesTotals.keys()).sort()],
      systemOptions: ["All", ...Array.from(systemTotals.keys()).sort()],
      speciesTotalCounts: speciesTotals,
      speciesRemainingCounts: speciesRemaining,
      systemTotalCounts: systemTotals,
      systemRemainingCounts: systemRemaining,
      totalRemainingCount: remaining,
    };
  }, [pool, completedQuestionSet]);

  const availableQuestions = React.useMemo(() => {
    return pool.filter((q) => {
      const speciesMatch = species === "All" || q.species.includes(species);
      const systemMatch = system === "All" || q.system === system;

      // Filter out completed questions ONLY in practice mode
      const isCompleted = completedQuestionSet.has(q.id || "");

      if (isTimed) return speciesMatch && systemMatch;

      // In practice mode, handle review mode vs normal mode
      const completionMatch = reviewMode ? isCompleted : !isCompleted;

      return speciesMatch && systemMatch && completionMatch;
    });
  }, [
    species,
    system,
    pool,
    completedQuestionSet,
    isTimed,
    reviewMode,
  ]);

  const countOptions = ["5", "10", "20", "50", "60", "100", "All"];

  const getActualCount = () => {
    if (countSelection === "All") return availableQuestions.length;
    return Math.min(parseInt(countSelection), availableQuestions.length);
  };

  const handleStart = async () => {
    const count = getActualCount();
    const mode = isTimed ? "exam" : reviewMode ? "review" : "practice";

    try {
      const quizSession = await api.getQuestionSession({
        species,
        system,
        count: countSelection === "All" ? "All" : count,
        mode,
      });

      sessionStorage.setItem(
        "vet_quiz_session",
        JSON.stringify({
          questions: quizSession.questions,
          config: {
            ...quizSession.config,
            species,
            system,
            count: quizSession.questions.length,
            isTimed,
            duration: isTimed ? quizSession.questions.length * 120 : null,
          },
        },
        ),
      );

      navigate("/quizzes/session");
    } catch (error) {
      console.error("Failed to start quiz session:", error);
      toast.error("Failed to start quiz session");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      {/* Header Section: The Laboratory Identity */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-border/50 pb-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${isTimed ? "bg-rose-500 animate-pulse" : "bg-primary"}`}
            />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Clinical Assessment Protocol
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tightest leading-none">
            {isTimed ? (
              <span className="text-rose-500 uppercase italic">
                Exam.<span className="not-italic opacity-50">SIM</span>
              </span>
            ) : (
              <span>
                Knowledge.<span className="text-primary italic">CORE</span>
              </span>
            )}
          </h1>
          <p className="text-muted-foreground font-medium max-w-md text-base sm:text-lg">
            {isTimed
              ? "Realistic simulation of professional board examinations with strict time constraints."
              : "Interactive practice environment for clinical case review and diagnostic mastery."}
          </p>
        </div>

        <div className="bg-muted/50 p-1.5 rounded-2xl flex gap-1 border border-border/50 backdrop-blur-sm w-fit">
          {profile?.isAdmin && (
            <Link
              to="/admin/questions"
              className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 flex items-center gap-1 mr-2"
            >
              <Settings className="h-3.5 w-3.5" /> Manage Pool
            </Link>
          )}
          <button
            onClick={() => {
              setIsTimed(false);
              setCountSelection("10");
            }}
            className={`px-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${!isTimed ? "bg-background text-primary shadow-lg border border-primary/10" : "text-muted-foreground hover:bg-background/40"}`}
          >
            <Zap className="h-3.5 w-3.5" />
            Practice
          </button>
          <button
            onClick={() => {
              setIsTimed(true);
              setCountSelection("60");
            }}
            className={`px-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isTimed ? "bg-rose-600 text-white shadow-lg" : "text-muted-foreground hover:bg-background/40"}`}
          >
            <TimerIcon className="h-3.5 w-3.5" />
            Exam
          </button>
        </div>
      </motion.div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-muted/40 p-6 lg:p-8 rounded-[40px] border border-border">
        {/* Left: Configuration Panel */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-6 bg-background rounded-3xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-primary rounded-full transition-all" />
              <h3 className="text-xl font-bold tracking-tight">Focus Domain</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Species
                </Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-border/50 focus:border-primary/50 transition-all text-sm font-bold px-6">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((opt) => {
                      const totalCount =
                        opt === "All"
                          ? pool.length
                          : speciesTotalCounts.get(opt) || 0;

                      const remainingCount =
                        opt === "All"
                          ? totalRemainingCount
                          : speciesRemainingCounts.get(opt) || 0;

                      return (
                        <SelectItem
                          key={opt}
                          value={opt}
                          className="font-medium"
                        >
                          <div className="flex justify-between items-center w-full min-w-[120px]">
                            <span>{opt}</span>
                            <span className="text-[10px] opacity-50 px-2 py-0.5 bg-muted rounded-full ml-4">
                              {isTimed ? totalCount : remainingCount}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Anatomical System
                </Label>
                <Select value={system} onValueChange={setSystem}>
                  <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-border/50 focus:border-primary/50 transition-all text-sm font-bold px-6">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemOptions.map((opt) => {
                      const totalCount =
                        opt === "All"
                          ? pool.length
                          : systemTotalCounts.get(opt) || 0;

                      const remainingCount =
                        opt === "All"
                          ? totalRemainingCount
                          : systemRemainingCounts.get(opt) || 0;

                      return (
                        <SelectItem
                          key={opt}
                          value={opt}
                          className="font-medium"
                        >
                          <div className="flex justify-between items-center w-full min-w-[120px]">
                            <span>{opt}</span>
                            <span className="text-[10px] opacity-50 px-2 py-0.5 bg-muted rounded-full ml-4">
                              {isTimed ? totalCount : remainingCount}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-6 bg-background rounded-3xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-primary/30 rounded-full" />
              <h3 className="text-xl font-bold tracking-tight">
                Question Intensity
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Item Count
                </Label>
                <Select value={countSelection} onValueChange={setCountSelection}>
                  <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-border/50 focus:border-primary/50 transition-all text-sm font-bold px-6">
                    <SelectValue placeholder="Select intensity count" />
                  </SelectTrigger>
                  <SelectContent>
                    {countOptions.map((opt) => (
                      <SelectItem
                        key={opt}
                        value={opt}
                        disabled={
                          opt !== "All" &&
                          parseInt(opt) > availableQuestions.length &&
                          availableQuestions.length > 0
                        }
                        className="font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span>{opt}</span>
                          <span className="text-[10px] opacity-70 font-black uppercase tracking-tighter">
                            Items
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div
            className={`pt-2 flex flex-col sm:grid sm:grid-cols-2 gap-6`}
          >
            <div className="p-8 rounded-3xl bg-background border border-border/50 space-y-1 shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Available Cases
              </p>
              <p className="text-4xl font-black text-foreground">
                {availableQuestions.length}
              </p>
            </div>
            {isTimed ? (
              <div className="p-8 rounded-3xl bg-background border border-border/50 space-y-1 shadow-sm">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Est. Duration
                </p>
                <p className="text-4xl font-black text-foreground">
                  {getActualCount() * 1}
                  <span className="text-sm ml-1 opacity-50 font-medium">
                    min
                  </span>
                </p>
              </div>
            ) : (
              <div
                className={`p-8 rounded-3xl border space-y-4 transition-all duration-300 shadow-sm ${reviewMode ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-background border-border/50"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${reviewMode ? "text-primary-foreground/70" : "text-primary"}`}
                    >
                      Mastered Pool
                    </p>
                    <p className="text-4xl font-black">
                      {completedQuestionIds.length}
                    </p>
                  </div>
                  <BookMarked
                    className={`h-6 w-6 ${reviewMode ? "text-primary-foreground/40" : "text-primary/40"}`}
                  />
                </div>

                <div className="space-y-3">
                  <p
                    className={`text-[10px] font-medium italic ${reviewMode ? "text-primary-foreground/60" : "text-primary/60"}`}
                  >
                    {reviewMode
                      ? "Currently reviewing mastered cases"
                      : "Stored from successful practice"}
                  </p>
                  <Button
                    variant={reviewMode ? "secondary" : "outline"}
                    size="sm"
                    className={`w-full rounded-2xl font-black text-[10px] h-10 ${reviewMode ? "bg-white text-primary border-none shadow-sm" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                    onClick={() => setReviewMode(!reviewMode)}
                  >
                    {reviewMode
                      ? "RETURN TO MAIN POOL"
                      : "REVIEW MASTERED CASES"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: The Final Assembly & Status */}
        <div className="lg:col-span-4 sticky top-8 space-y-6">
          <Card
            className={`border-none shadow-2xl relative overflow-hidden transition-all duration-500 ${isTimed ? "bg-rose-600 ring-8 ring-rose-600/10" : "bg-primary ring-8 ring-primary/10"}`}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Stethoscope className="h-40 w-40 text-white" />
            </div>

            <CardContent className="relative z-10 space-y-6 pt-8">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-white space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-60 font-bold uppercase tracking-widest">
                    Selected Item Count
                  </span>
                  <span className="font-black">{getActualCount()}</span>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={availableQuestions.length === 0}
                className="w-full h-[63px] mt-3 rounded-2xl bg-white text-zinc-900 hover:bg-white/90 disabled:opacity-100 disabled:bg-black/20 disabled:text-white/60 text-xl font-black transition-all transform active:scale-95 group shadow-xl"
              >
                {isTimed ? "START EXAM" : "LAUNCH SESSION"}
                <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {user?.email === "sravan96mufc@gmail.com" && (
            <Link
              to="/import"
              className="flex items-center justify-center gap-3 p-6 rounded-[32px] border border-primary/20 bg-primary/5 transition-all hover:bg-primary/10 group group-hover:border-primary/40"
            >
              <Upload className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  Import New Data
                </p>
                <p className="text-[10px] text-muted-foreground italic leading-tight">
                  Scale your medical repository
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {availableQuestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-0 bottom-10 max-w-lg mx-auto z-50 text-center text-rose-600 text-sm font-bold bg-rose-50/80 backdrop-blur-md p-8 rounded-[32px] border-4 border-rose-100 shadow-2xl"
          >
            <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
            <p className="text-xl font-black italic tracking-tight">
              Empty Repository State
            </p>
            <p className="text-xs font-medium mt-1 mb-6 opacity-70">
              No matching clinical cases found for the selected parameters.
            </p>
            <Button
              variant="outline"
              className="rounded-full border-rose-200 px-8 hover:bg-rose-50 font-black text-rose-600"
              onClick={() => {
                setSpecies("All");
                setSystem("All");
              }}
            >
              RESET FILTERS
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
