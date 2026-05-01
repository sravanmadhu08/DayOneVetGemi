import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChevronLeft, Upload, Sparkles, Loader2, Database, Search, Filter, LayoutList } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BulkImport } from "@/src/components/BulkImport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DEFAULT_QUESTIONS } from "@/src/constants";

export default function AdminQuestions() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  const [systemOptions, setSystemOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    species: [] as string[],
    system: "",
  });

  useEffect(() => {
    if (!profile?.isAdmin) return;

    const settingsUnsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSpeciesOptions(data.speciesOptions || []);
        setSystemOptions(data.systemOptions || []);
      }
    });

    const q = query(collection(db, "questions"), where("userId", "==", null));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "questions"),
    );
    return () => {
      unsub();
      settingsUnsub();
    };
  }, [profile]);

  if (!profile?.isAdmin) {
    return <Navigate to="/" />;
  }

  const handleSeedQuestions = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      for (const q of DEFAULT_QUESTIONS) {
        const newDoc = doc(collection(db, "questions"));
        batch.set(newDoc, {
          ...q,
          createdAt: Date.now()
        });
      }
      await batch.commit();
      toast.success("Defaults Seeded");
    } catch (err) {
      toast.error("Seeding Failed");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        question: formData.question,
        options: formData.options,
        correctAnswer: Number(formData.correctAnswer),
        explanation: formData.explanation,
        species: formData.species,
        system: formData.system,
      };

      if (editingQuestion) {
        await updateDoc(doc(db, "questions", editingQuestion.id), payload);
        toast.success("Question Updated");
      } else {
        await addDoc(collection(db, "questions"), {
          ...payload,
          userId: null,
          createdAt: serverTimestamp(),
        });
        toast.success("Question Added to Pool");
      }
      setIsOpen(false);
      setEditingQuestion(null);
      setFormData({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        species: [],
        system: "",
      });
    } catch (error) {
      handleFirestoreError(
        error,
        editingQuestion ? OperationType.UPDATE : OperationType.CREATE,
        "questions",
      );
    }
  };

  const openEdit = (q: any) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question,
      options: q.options || ["", "", "", ""],
      correctAnswer: q.correctAnswer || 0,
      explanation: q.explanation || "",
      species: q.species || [],
      system: q.system || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "questions", id));
      toast.success("Question Removed");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "questions");
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.system.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             Question Engine <LayoutList className="h-6 w-6 text-primary" />
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="rounded-xl font-bold gap-2 border-primary/20">
              <Upload className="h-4 w-4 text-primary" /> Bulk AI Import
           </Button>

           <Button 
             variant="outline" 
             onClick={handleSeedQuestions} 
             disabled={isSeeding}
             className="rounded-xl font-bold gap-2 border-primary/20"
           >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4 text-primary" />}
              Seed Sync
           </Button>

           <Dialog 
              open={isOpen} 
              onOpenChange={(v) => {
                setIsOpen(v);
                if (!v) setEditingQuestion(null);
              }}
           >
             <DialogTrigger asChild>
               <Button className="rounded-xl font-black uppercase tracking-widest text-xs h-10 px-6 shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4 mr-2" /> Manual Entry
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    {editingQuestion ? "Edit Clinical Scenario" : "New Question"}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-black uppercase tracking-widest opacity-50">
                     Validation & Entry Layer
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                  <div className="space-y-5">
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1">Stem</Label>
                       <Textarea
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          required
                          className="rounded-xl min-h-[100px] bg-muted/30 border-none font-bold"
                          placeholder="Clinical presentation..."
                       />
                    </div>
                    
                    <div className="space-y-3">
                       <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1">District Options</Label>
                       {formData.options.map((opt, i) => (
                         <div key={i} className="flex gap-4 items-center group">
                            <span className="text-[10px] font-black w-4 opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all uppercase">{String.fromCharCode(65 + i)}</span>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const next = [...formData.options];
                                next[i] = e.target.value;
                                setFormData({ ...formData, options: next });
                              }}
                              required
                              className="rounded-xl h-10 bg-muted/20 border-none font-bold transition-all focus:bg-muted/40"
                              placeholder={`Option ${i+1}`}
                            />
                            <div 
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${formData.correctAnswer === i ? "bg-primary border-primary text-white" : "border-muted-foreground/20 hover:border-primary/50"}`}
                              onClick={() => setFormData({ ...formData, correctAnswer: i })}
                            >
                               {formData.correctAnswer === i && <Plus className="h-3 w-3 rotate-45" strokeWidth={4} />}
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1">Rationale</Label>
                       <Textarea
                          value={formData.explanation}
                          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                          className="rounded-xl min-h-[100px] bg-muted/30 border-none font-medium text-sm"
                          placeholder="Evidence-based reasoning..."
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1">Taxonomy</Label>
                          <Select value={formData.system} onValueChange={(val) => setFormData({ ...formData, system: val })}>
                            <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none font-bold">
                               <SelectValue placeholder="System..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                               {systemOptions.map(sys => <SelectItem key={sys} value={sys}>{sys}</SelectItem>)}
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1">Target Species</Label>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-xl min-h-[44px]">
                             {speciesOptions.map(sp => (
                               <button
                                 key={sp}
                                 type="button"
                                 onClick={() => {
                                   const next = formData.species.includes(sp) ? formData.species.filter(s => s !== sp) : [...formData.species, sp];
                                   setFormData({...formData, species: next});
                                 }}
                                 className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                                   formData.species.includes(sp) ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/50 text-muted-foreground hover:bg-white"
                                 }`}
                               >
                                 {sp}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl font-black uppercase tracking-widest text-xs h-14 shadow-xl shadow-primary/10 mt-4">
                     {editingQuestion ? "Archive & Replace" : "Inject into Pool"}
                  </Button>
                </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <BulkImport />
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="relative h-14 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Interrogate the clinical database..."
            className="h-full pl-14 pr-6 rounded-2xl bg-muted/20 border-none text-lg font-bold placeholder:text-muted-foreground/50 transition-all focus:bg-muted/30"
          />
        </div>

        <div className="grid gap-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-primary/10 hover:bg-primary/5" onClick={() => openEdit(q)}>
                    <Edit2 className="h-4 w-4" />
                 </Button>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent className="rounded-3xl">
                     <AlertDialogHeader>
                       <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
                       <AlertDialogDescription>Remove this clinical scenario from the active rotation?</AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                       <AlertDialogAction onClick={() => handleDelete(q.id)} className="bg-destructive text-white rounded-xl">Execute</AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest p-1 px-3 rounded-lg border-primary/20 text-primary bg-primary/5">
                      {q.system}
                   </Badge>
                   <div className="flex gap-1">
                      {q.species?.map((s: string) => (
                         <span key={s} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded italic">#{s}</span>
                      ))}
                   </div>
                </div>

                <h3 className="text-lg font-black leading-tight pr-20 text-foreground">
                  {q.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pt-2">
                  {q.options?.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className={`text-xs flex items-start gap-2 p-2 rounded-lg ${q.correctAnswer === i ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20" : "text-muted-foreground font-medium"}`}
                    >
                      <span className="opacity-30 uppercase font-black shrink-0">{String.fromCharCode(65 + i)}</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-muted/5 rounded-[3rem] border border-dashed border-border/30">
               <Filter className="h-12 w-12 text-muted-foreground/20 mb-4" />
               <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Zero Intersections</h3>
               <p className="text-xs text-muted-foreground/60 mt-1">Adjust your parameters or add new data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

