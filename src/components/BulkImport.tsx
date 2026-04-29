import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { parseQuestionsFromText } from '../services/geminiService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export function BulkImport() {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('none');

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const snap = await getDocs(collection(db, 'pdfs'));
        setPdfs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch PDFs for bulk import context");
      }
    };
    fetchPdfs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file || !user) return;

    setLoading(true);
    setStatus('Extracting text from document...');
    setProgress(20);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      setStatus('Gemini is analyzing and structuring questions...');
      setProgress(50);
      
      const questions = await parseQuestionsFromText(text);
      
      setStatus(`Importing ${questions.length} questions to your library...`);
      setProgress(80);

      const batch = writeBatch(db);
      const path = 'questions';

      questions.forEach((q) => {
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, {
          ...q,
          userId: profile?.isAdmin ? null : user.uid,
          sourceId: selectedSourceId !== 'none' ? selectedSourceId : null,
          createdAt: Date.now()
        });
      });

      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, path));

      setProgress(100);
      setStatus('Success! Questions added.');
      toast.success(`${questions.length} questions imported successfully!`);
      setFile(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to process document');
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Bulk Data Import
        </CardTitle>
        <CardDescription>
          Upload .docx files containing your questions. Our AI will automatically structure them for your library.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reference PDF (Context)</Label>
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-muted">
                <SelectValue placeholder="Select reference from library..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific reference</SelectItem>
                {pdfs.map(pdf => (
                  <SelectItem key={pdf.id} value={pdf.id}>{pdf.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground ml-1 italic">Extracted questions will be linked to this document.</p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-2xl bg-background/50 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
          <input 
            type="file" 
            accept=".docx" 
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={loading}
          />
          {file ? (
            <div className="space-y-2">
              <FileText className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm font-bold">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold">Click or drag & drop</p>
              <p className="text-xs text-muted-foreground">Support for .docx medical scripts</p>
            </div>
          )}
        </div>
      </div>

      {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button 
          className="w-full flex items-center justify-center gap-2 h-12 text-sm font-bold rounded-xl shadow-lg shadow-primary/20"
          onClick={processFile}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Start Bulk Import
            </>
          )}
        </Button>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p className="text-[10px] leading-relaxed font-medium">
            AI processing might take up to 30 seconds for large files. Ensure questions have clear options and explanations for best results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
