import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, Loader2, Sparkles, Database, Command, FileUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export function BulkImport() {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('none');

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const data = await api.getDocuments();
        setPdfs(data);
      } catch (err) {
        console.error("Failed to fetch documents for bulk import context");
      }
    };
    fetchPdfs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.info(`Asset staged: ${e.target.files[0].name}`);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('Uploading and parsing document via AI...');
    setProgress(30);

    try {
      const questions = await api.parseQuestionsFromDocx(file, selectedSourceId);
      
      setStatus(`Imported ${questions.length} tactical units to library...`);
      setProgress(90);

      setProgress(100);
      setStatus('Ingestion complete. Metrics updated.');
      toast.success(`${questions.length} clinical datasets ingested successfully!`);
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Telemetry failure during document processing');
      setStatus('Terminal Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl shadow-muted/5 bg-card/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-border/40">
      <CardHeader className="p-10 pb-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <Database className="h-4 w-4" strokeWidth={3} />
            Bulk Asset Ingestion
          </CardTitle>
          <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">AI-Driven Tactical Data Structuring</CardDescription>
        </div>
        <FileUp className="absolute -right-8 -top-8 h-32 w-32 opacity-5 -rotate-12" />
      </CardHeader>
      <CardContent className="p-10 pt-0 space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Relational Context (Primary Reference)</Label>
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none focus:ring-2 focus:ring-primary/20 shadow-inner px-6 text-sm font-medium">
                <SelectValue placeholder="Select reference from core library..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="none">Isolated Import (No Reference)</SelectItem>
                {pdfs.map(pdf => (
                  <SelectItem key={pdf.id} value={pdf.id}>{pdf.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/40 ml-1 font-medium flex items-center gap-2">
              <Command className="h-3 w-3" />
              Intelligence will be logically mapped to the selected asset.
            </p>
          </div>

          <div className="group relative">
            <div className={`p-12 border-2 border-dashed rounded-[2.5rem] bg-muted/10 text-center cursor-pointer transition-all duration-500 overflow-hidden relative ${file ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-primary/30 hover:bg-muted/20'}`}>
              <input 
                type="file" 
                accept=".docx" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                disabled={loading}
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 relative z-10"
                  >
                    <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xl shadow-primary/5">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{file.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Payload size: {(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-file"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 relative z-10"
                  >
                    <div className="h-16 w-16 bg-muted/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all border border-border/50">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">Stage Intelligence Asset</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Accepting medical .docx protocols only</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                {status}
              </span>
              <span className="text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-muted/30" />
          </div>
        )}

        <Button 
          className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          onClick={processFile}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-3" />
              Processing Command...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-3" strokeWidth={3} />
              Execute Neural Import
            </>
          )}
        </Button>

        <div className="flex items-start gap-4 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wide">
            Neural processing latency is expected to be ~30s for large clinical datasets. Ensure input documents utilize standard medical formatting for maximum accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

