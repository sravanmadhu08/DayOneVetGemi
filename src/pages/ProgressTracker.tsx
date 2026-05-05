import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Target, AlertCircle, BookOpen, Clock, ChevronRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuizResult {
  id: string;
  score: number;
  total: number;
  correct: number;
  timestamp: string; // ISO string from Django
  system: string;
  species: string;
}

export default function ProgressTracker() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await api.getQuizHistory(50);
        const results = data.map(d => ({
          id: String(d.id),
          score: d.score,
          total: d.total_questions,
          correct: d.correct_count,
          timestamp: d.created_at,
          system: d.system || 'General',
          species: d.species || 'All'
        } as QuizResult));
        setHistory(results);
      } catch (err) {
        console.error('Error fetching history:', err);
        toast.error("Failed to fetch performance telemetry");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const systemStats = React.useMemo(() => {
    const stats: Record<string, { total: number, correct: number, count: number }> = {};
    history.forEach(res => {
      const key = res.system || 'General';
      if (!stats[key]) stats[key] = { total: 0, correct: 0, count: 0 };
      stats[key].total += res.total;
      stats[key].correct += res.correct;
      stats[key].count += 1;
    });
    return Object.entries(stats).map(([name, s]) => ({
      name,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      count: s.count
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [history]);

  const globalStats = React.useMemo(() => {
    const totalQs = history.reduce((acc, curr) => acc + curr.total, 0);
    const totalCorrect = history.reduce((acc, curr) => acc + curr.correct, 0);
    const avgScore = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
    const recentAvg = history.slice(0, 5).reduce((acc, curr) => acc + curr.score, 0) / Math.min(history.length, 5) || 0;
    
    // Readiness is a blend of consistency and recent performance
    const readinessScore = Math.min(100, Math.round((avgScore * 0.4) + (recentAvg * 0.6)));
    
    return { totalQs, avgScore, readinessScore };
  }, [history]);

  const chartData = [...history].reverse().map((res, idx) => ({
    name: idx + 1,
    score: res.score,
    date: res.timestamp ? new Date(res.timestamp).toLocaleDateString() : 'New'
  }));

  const weaknesses = systemStats.filter(s => s.accuracy < 70).slice(0, 3);
  const strengths = systemStats.filter(s => s.accuracy >= 85).slice(0, 3);
  const recommendedTopic = weaknesses[0] || systemStats[systemStats.length - 1];

  if (loading) return <div className="flex justify-center items-center h-64 font-black uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">Analyzing progress metrics...</div>;

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Performance <span className="text-primary italic">Analytics</span></h1>
          <p className="text-muted-foreground font-medium">Detailed insights into your clinical growth and board readiness.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 font-black text-[10px] uppercase border-primary/20 text-primary">
            Analytics Engine v1.2
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: globalStats.totalQs, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Avg. Accuracy', value: `${globalStats.avgScore}%`, icon: Target, color: 'text-primary' },
          { label: 'Study Sessions', value: history.length, icon: Clock, color: 'text-amber-500' },
          { label: 'Readiness Index', value: `${globalStats.readinessScore}%`, icon: TrendingUp, color: 'text-green-500' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-muted/20 rounded-2xl">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-black">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 rounded-3xl border-border/40 shadow-xl shadow-muted/5">
          <CardHeader>
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Progression
            </CardTitle>
            <CardDescription className="text-xs font-medium">Accuracy trend over your last {history.length} sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} stroke="#888888" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    labelFormatter={(label) => `Test #${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 3, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">
                No history data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
            <CardHeader className="pb-2 text-center pt-8">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 rotate-12">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xs uppercase tracking-widest font-black">Top Weaknesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pb-8">
              {weaknesses.length > 0 ? weaknesses.map(stat => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                    <span>{stat.name}</span>
                    <span className="text-red-500 font-black">{stat.accuracy}%</span>
                  </div>
                  <Progress value={stat.accuracy} className="h-2 bg-red-100 rounded-full" />
                </div>
              )) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/40 py-4">Keep testing to identify weak spots.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-200/50 dark:border-green-900/30 rounded-3xl overflow-hidden shadow-xl shadow-green-500/5">
            <CardHeader className="pb-2 text-center pt-8">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 -rotate-12">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xs uppercase tracking-widest font-black text-green-700 dark:text-green-400">Mastered Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-8 px-6">
              {strengths.length > 0 ? strengths.map(stat => (
                <div key={stat.name} className="flex justify-between items-center bg-white/80 dark:bg-black/20 p-3 rounded-2xl border border-green-100 dark:border-green-900/50">
                   <span className="text-[11px] font-black uppercase tracking-tight">{stat.name}</span>
                   <Badge variant="secondary" className="bg-green-100 text-green-700 border-none font-black text-[10px]">{stat.accuracy}%</Badge>
                </div>
              )) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/40 py-4">No mastered categories yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        <div className="space-y-6">
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            Accuracy by System
          </h3>
          <Card className="rounded-3xl overflow-hidden border-border/40">
            <CardContent className="p-0">
              {systemStats.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {systemStats.map((stat) => (
                    <div key={stat.name} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{stat.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">{stat.count} Sessions Logged</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-32 bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${stat.accuracy}%` }} />
                        </div>
                        <span className="font-mono font-black text-sm w-10 text-right">{stat.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-muted-foreground font-black uppercase tracking-widest text-[10px] opacity-40">No system data recorded.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
               <Clock className="h-4 w-4 text-amber-500" />
             </div>
             Recent History
          </h3>
          <div className="space-y-4">
            {history.slice(0, 6).map((res) => (
              <Card key={res.id} className="overflow-hidden group hover:border-primary/30 transition-all rounded-3xl border-border/40 shadow-xl shadow-muted/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black ${res.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {res.score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-black uppercase tracking-tight truncate">{res.system} • {res.species}</p>
                        <Badge variant="outline" className="text-[9px] h-5 uppercase px-2 font-black border-muted-foreground/20 text-muted-foreground shrink-0">{res.total} Qs</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                        {res.timestamp ? new Date(res.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <Link to="/quizzes" className="p-2 rounded-xl hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
            {history.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed rounded-[3rem] border-muted/50 space-y-6 bg-muted/5">
                 <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto" strokeWidth={2} />
                 <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">No Intelligence Logged</p>
                   <p className="text-muted-foreground font-medium text-sm">Start your first clinical session to track growth.</p>
                 </div>
                 <Link to="/quizzes" className="inline-flex items-center bg-primary text-primary-foreground h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
                    Deploy Initial Quiz
                 </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
