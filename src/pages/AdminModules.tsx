import { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Edit2, ChevronLeft, Sparkles, Loader2, Database, LayoutGrid } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_MODULES } from "@/src/constants";

export default function AdminModules() {
  const { profile, globalSettings } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
    order: 0,
  });

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getModules();
      setModules(data);
    } catch (error) {
      console.error("Failed to fetch modules", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.isAdmin) {
      fetchModules();
    }
  }, [profile, fetchModules]);

  if (!profile?.isAdmin) {
    return <Navigate to="/" />;
  }

  const handleSeedModules = async () => {
    setIsSeeding(true);
    try {
      for (const m of DEFAULT_MODULES) {
        await api.createModule({
          ...m,
          order: Number(m.order)
        });
      }
      toast.success("Defaults Synced");
      fetchModules();
    } catch (err) {
      toast.error("Sync Failed");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModule) {
        await api.updateModule(editingModule.id, {
          ...formData,
          order: Number(formData.order)
        });
        toast.success("Module Updated");
      } else {
        await api.createModule({
          ...formData,
          order: Number(formData.order)
        });
        toast.success("New Module Created");
      }
      setIsOpen(false);
      setEditingModule(null);
      setFormData({ title: "", category: "", content: "", order: 0 });
      fetchModules();
    } catch (error) {
      toast.error("Operation failure");
    }
  };

  const openEdit = (m: any) => {
    setEditingModule(m);
    setFormData({
      title: m.title,
      category: m.category,
      content: m.content || "",
      order: m.order || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.deleteModule(id);
      toast.success("Module Deleted");
      fetchModules();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleDeleteAll = async () => {
    try {
      for (const m of modules) {
        await api.deleteModule(m.id);
      }
      toast.success("Database Cleared");
      fetchModules();
    } catch (error) {
      toast.error("Wipe failed");
    }
  };

  const systemOptions = globalSettings?.systemOptions || [];

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
             Curriculum Control <Database className="h-6 w-6 text-primary" />
          </h1>
        </div>

        <div className="flex items-center gap-3">
           {modules.length > 0 && (
             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button variant="outline" className="rounded-xl font-bold gap-2 text-destructive border-none bg-destructive/5 hover:bg-destructive hover:text-white transition-all">
                   <Trash2 className="h-4 w-4" /> Wipe
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent className="rounded-3xl">
                 <AlertDialogHeader>
                   <AlertDialogTitle>Dangerous Action</AlertDialogTitle>
                   <AlertDialogDescription>
                     This will permanently delete ALL modules from the production database.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">
                     Execute Wipe
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
           )}

           <Button 
             variant="outline" 
             onClick={handleSeedModules} 
             disabled={isSeeding}
             className="rounded-xl font-bold gap-2 border-primary/20"
           >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              Set Defaults
           </Button>

           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogTrigger asChild>
               <Button className="rounded-xl font-black uppercase tracking-widest text-xs h-10 px-6 shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4 mr-2" /> New Module
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-xl rounded-3xl p-8">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black">
                   {editingModule ? "Edit Curriculum" : "New Module"}
                 </DialogTitle>
                 <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-50">
                    Configuration Engine
                 </DialogDescription>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                 <div className="space-y-5">
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1 text-foreground">Title</Label>
                     <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="rounded-xl h-12 bg-muted/30 border-none px-4 font-bold"
                        placeholder="e.g. Cardiology Basics"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1 text-foreground">Category</Label>
                       <Select 
                          value={formData.category} 
                          onValueChange={(val) => setFormData({ ...formData, category: val })}
                          required
                       >
                         <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none font-bold">
                           <SelectValue placeholder="System..." />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl font-bold">
                           {systemOptions.map(sys => (
                             <SelectItem key={sys} value={sys}>{sys}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1 text-foreground">Priority</Label>
                       <Input
                         type="number"
                         value={formData.order}
                         onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                         required
                         className="rounded-xl h-12 bg-muted/30 border-none font-bold"
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase tracking-widest opacity-50 ml-1 text-foreground">Overview</Label>
                     <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="rounded-xl min-h-[120px] bg-muted/30 border-none p-4 font-medium"
                        placeholder="Markdown supported..."
                     />
                   </div>
                 </div>
                 <Button type="submit" className="w-full rounded-xl font-black uppercase tracking-widest text-xs h-14 shadow-xl shadow-primary/10">
                   {editingModule ? "Save Changes" : "Deploy Module"}
                 </Button>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <div
            key={m.id}
            className="bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pointer-events-none">
                 <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary bg-primary/5 px-3 py-1 rounded-full">
                    {m.category}
                 </Badge>
                 <span className="text-[10px] font-black text-muted-foreground opacity-30">ORD. {m.order}</span>
              </div>
              
              <h3 className="text-xl font-black leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {m.title}
              </h3>
              
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                {m.content?.replace(/#+\s/g, "") || "No specification provided for this module."}
              </p>
            </div>

            <div className="pt-8 flex items-center gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl h-10 font-bold gap-2 text-xs border-primary/10 hover:bg-primary/5"
                onClick={() => openEdit(m)}
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Immediate Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove <span className="font-bold text-foreground">{m.title}</span> from the curriculum.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(m.id)} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-muted/10 rounded-[3rem] border border-dashed border-border/50">
             <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
             <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Empty Curriculum</h3>
             <p className="text-xs text-muted-foreground mt-1">Ready for initialization.</p>
          </div>
        )}
      </div>
    </div>
  );
}

