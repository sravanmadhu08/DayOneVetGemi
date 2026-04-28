import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
  timestamp: any;
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
      const path = `users/${user.uid}/quizHistory`;
      try {
        const q = query(
          collection(db, 'users', user.uid, 'quizHistory'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as QuizResult));
        setHistory(results);
      } catch (err) {
        console.error('Error fetching history:', err);
        handleFirestoreError(err, OperationType.GET, path);
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
      accuracy: Math.round((s.correct / s.total) * 100),
      count: s.count
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [history]);

  const globalStats = React.useMemo(() => {
    const totalQs = history.reduce((acc, curr) => acc + curr.total, 0);
    const totalCorrect = history.reduce((acc, curr) => acc + curr.correct, 0);
    const avgScore = history.length > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
    const recentAvg = history.slice(0, 5).reduce((acc, curr) => acc + curr.score, 0) / Math.min(history.length, 5) || 0;
    
    // Readiness is a blend of consistency and recent performance
    const readinessScore = Math.min(100, Math.round((avgScore * 0.4) + (recentAvg * 0.6)));
    
    return { totalQs, avgScore, readinessScore };
  }, [history]);

  const chartData = [...history].reverse().map((res, idx) => ({
    name: idx + 1,
    score: res.score,
    date: res.timestamp?.toDate ? res.timestamp.toDate().toLocaleDateString() : 'New'
  }));

  const weaknesses = systemStats.filter(s => s.accuracy < 70).slice(0, 3);
  const strengths = systemStats.filter(s => s.accuracy >= 85).slice(0, 3);
  const recommendedTopic = weaknesses[0] || systemStats[systemStats.length - 1];

  if (loading) return <div className="flex justify-center items-center h-64">Analyzing progress...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your clinical growth and board readiness.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 font-mono text-[10px] uppercase font-bold">
            Analytics Engine v1.2
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: globalStats.totalQs, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Avg. Accuracy', value: `${globalStats.avgScore}%`, icon: Target, color: 'text-primary' },
          { label: 'Study Sessions', value: history.length, icon: Clock, color: 'text-amber-500' },
          { label: 'Readiness Index', value: `${globalStats.readinessScore}%`, icon: TrendingUp, color: 'text-green-500' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-muted/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Progression
            </CardTitle>
            <CardDescription>Accuracy trend over your last {history.length} sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelFormatter={(label) => `Test #${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic">
                No history data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm uppercase tracking-widest font-bold">Top Weaknesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weaknesses.length > 0 ? weaknesses.map(stat => (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{stat.name}</span>
                    <span className="text-red-500 font-bold">{stat.accuracy}%</span>
                  </div>
                  <Progress value={stat.accuracy} className="h-1 bg-red-100" />
                </div>
              )) : (
                <p className="text-xs text-center text-muted-foreground italic">Keep testing to identify weak spots.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/30">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-sm uppercase tracking-widest font-bold text-green-700 dark:text-green-400">Mastered Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strengths.length > 0 ? strengths.map(stat => (
                <div key={stat.name} className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-green-100 dark:border-green-900/50">
                   <span className="text-xs font-bold">{stat.name}</span>
                   <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">{stat.accuracy}%</Badge>
                </div>
              )) : (
                <p className="text-xs text-center text-muted-foreground italic">No mastered categories yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Accuracy by System
          </h3>
          <Card>
            <CardContent className="p-0">
              {systemStats.length > 0 ? (
                <div className="divide-y">
                  {systemStats.map((stat) => (
                    <div key={stat.name} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{stat.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{stat.count} Sessions Logged</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${stat.accuracy}%` }} />
                        </div>
                        <span className="font-mono font-black text-sm w-8">{stat.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground italic">No system data recorded.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent History
          </h3>
          <div className="space-y-3">
            {history.slice(0, 8).map((res) => (
              <Card key={res.id} className="overflow-hidden group hover:border-primary/30 transition-all">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${res.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {res.score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-extrabold truncate">{res.system} - {res.species}</p>
                        <Badge variant="outline" className="text-[10px] h-5 uppercase px-1.5 font-bold shrink-0">{res.total} Qs</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{res.timestamp?.toDate ? res.timestamp.toDate().toLocaleString() : 'Just now'}</p>
                    </div>
                  </div>
                  <Link to="/quizzes" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
            {history.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed rounded-3xl space-y-4">
                 <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                 <p className="text-muted-foreground">Nothing to show yet. Start your first session!</p>
                 <Link to="/quizzes" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold">Start Quiz</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
