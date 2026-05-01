import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, ChevronRight, CheckCircle2, LayoutGrid, Clock, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudyModule } from '@/src/types';
import { Badge } from '@/components/ui/badge';

interface RecentModulesProps {
  modules: StudyModule[];
  completedModuleIds: string[];
}

export function RecentModules({ modules, completedModuleIds }: RecentModulesProps) {
  const inProgress = modules.filter(m => !completedModuleIds.includes(m.id));
  const completed = modules.filter(m => completedModuleIds.includes(m.id));

  return (
    <Card className="h-full border-none shadow-2xl shadow-muted/5 bg-card/50 backdrop-blur-sm rounded-[2.5rem] flex flex-col overflow-hidden border border-border/40">
      <CardHeader className="p-10 pb-0">
        <div className="flex items-center justify-between group">
           <div className="space-y-1">
             <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
               <BookOpen className="h-4 w-4" strokeWidth={3} />
               Clinical Syllabus
             </CardTitle>
             <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Active Operative Protocols</CardDescription>
           </div>
           <Link to="/modules">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-muted/30 group-hover:bg-primary group-hover:text-white transition-all">
                 <ChevronRight className="h-5 w-5" />
              </Button>
           </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-8 pt-6">
        <div className="space-y-3">
          {inProgress.length > 0 ? (
            inProgress.slice(0, 5).map((module) => (
              <Link 
                key={module.id} 
                to={`/modules/${module.id}`}
                className="flex items-center p-4 bg-muted/10 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-primary/20 group animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="h-14 w-14 flex-shrink-0 bg-white dark:bg-muted/50 border border-border/50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                   <div className="relative">
                      <LayoutGrid className="h-6 w-6 text-primary" />
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-white animate-pulse" />
                   </div>
                </div>
                <div className="ml-5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-md">{module.category}</span>
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                        <Clock className="h-2 w-2" /> 12m read
                     </span>
                  </div>
                  <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors tracking-tight">{module.title}</h4>
                </div>
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-12">
                   <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))
          ) : (
             <div className="py-16 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 rotate-12">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black tracking-tight">System Synced</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">All high-priority modules mastered.</p>
             </div>
          )}

          {completed.length > 0 && (
             <div className="pt-6 mt-6 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                   <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Post-Operative Logs</h5>
                   <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase">{completed.length} Mastered</Badge>
                </div>
                
                <div className="grid gap-2">
                   {completed.slice(0, 2).map((module) => (
                    <Link 
                      key={module.id} 
                      to={`/modules/${module.id}`}
                      className="flex items-center p-3 sm:px-4 bg-emerald-500/5 rounded-xl grayscale hover:grayscale-0 transition-all group border border-transparent hover:border-emerald-500/20"
                    >
                      <div className="h-8 w-8 flex-shrink-0 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                         <Briefcase className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 truncate tracking-tight">{module.title}</h4>
                      </div>
                      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                         <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    </Link>
                  ))}
                </div>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';

