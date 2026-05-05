import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ChevronLeft, Plus, Trash2, LayoutGrid, PawPrint, Database, Settings2, Command, ShieldCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminSettings() {
  const { profile, globalSettings, updateGlobalSettings } = useAuth();
  const [species, setSpecies] = useState<string[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [newSpecies, setNewSpecies] = useState("");
  const [newSystem, setNewSystem] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setSpecies(globalSettings.speciesOptions || []);
      setSystems(globalSettings.systemOptions || []);
      setLoading(false);
    }
  }, [globalSettings]);

  if (!profile?.isAdmin) {
    return <Navigate to="/" />;
  }

  const updateSettings = async (updatedSpecies: string[], updatedSystems: string[]) => {
    try {
      await updateGlobalSettings({
        speciesOptions: updatedSpecies,
        systemOptions: updatedSystems
      });
      setSpecies(updatedSpecies);
      setSystems(updatedSystems);
    } catch (error) {
       toast.error("Failed to update remote settings");
    }
  };

  const handleAddSpecies = async () => {
    if (!newSpecies.trim()) return;
    if (species.includes(newSpecies.trim())) {
      toast.error("Taxonomy overlap detected");
      return;
    }
    const updated = [...species, newSpecies.trim()];
    await updateSettings(updated, systems);
    setNewSpecies("");
    toast.success("Biological marker injected");
  };

  const handleDeleteSpecies = async (item: string) => {
    const updated = species.filter(s => s !== item);
    await updateSettings(updated, systems);
    toast.success("Marker purged");
  };

  const handleAddSystem = async () => {
    if (!newSystem.trim()) return;
    if (systems.includes(newSystem.trim())) {
      toast.error("System collision");
      return;
    }
    const updated = [...systems, newSystem.trim()];
    await updateSettings(species, updated);
    setNewSystem("");
    toast.success("Anatomical system registered");
  };

  const handleDeleteSystem = async (item: string) => {
    const updated = systems.filter(s => s !== item);
    await updateSettings(species, updated);
    toast.success("System de-registered");
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
       toast.info("Genesis via backend protocols in development");
    } catch (error) {
      toast.error("Seed interference");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Profile
          </Link>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             System Configuration <Settings2 className="h-6 w-6 text-primary" />
          </h1>
        </div>

        <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-2xl border border-border/50">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Admin Clearance Level 5</span>
           </div>
           <div className="h-4 w-px bg-border" />
           <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Core Active</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 p-2 overflow-hidden flex flex-col justify-between group">
           <div className="p-8 space-y-6">
             <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Database className="h-7 w-7 text-white" />
             </div>
             <div className="space-y-2">
               <CardTitle className="text-2xl font-black">Genesis Seed</CardTitle>
               <CardDescription className="text-primary-foreground/70 font-medium leading-relaxed">
                 Initialize the core clinical database with standardized medical protocols and modules.
               </CardDescription>
             </div>
           </div>
           <div className="p-8 pt-0">
             <Button 
               onClick={handleSeed} 
               disabled={seeding}
               variant="secondary"
               className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform"
             >
               {seeding ? "Syncing..." : "Execute Global Sync"}
             </Button>
           </div>
           <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
              <Command className="h-48 w-48 text-white rotate-12" />
           </div>
        </Card>

        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          {/* Systems Management */}
          <Card className="rounded-[2.5rem] border border-border/40 bg-card/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <LayoutGrid className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-xl font-black">Taxonomy: Systems</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-1 flex flex-col gap-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="Clinical category..." 
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value)}
                  className="rounded-xl h-12 bg-muted/20 border-none font-bold transition-all focus:bg-muted/40"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSystem()}
                />
                <Button onClick={handleAddSystem} size="icon" className="rounded-xl h-12 w-12 shrink-0">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {systems.map((s) => (
                  <div key={s} className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all group">
                    <span className="font-bold text-sm tracking-tight text-foreground/80">{s}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black">Archive Entry?</AlertDialogTitle>
                          <AlertDialogDescription className="font-medium">
                            Removing "{s}" will disconnect it from all future taxonomical groupings.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                          <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSystem(s)} className="bg-destructive text-white rounded-xl font-bold">Purge System</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Species Management */}
          <Card className="rounded-[2.5rem] border border-border/40 bg-card/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <PawPrint className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-xl font-black">Taxonomy: Species</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-1 flex flex-col gap-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="Biological cohort..." 
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  className="rounded-xl h-12 bg-muted/20 border-none font-bold transition-all focus:bg-muted/40"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSpecies()}
                />
                <Button onClick={handleAddSpecies} size="icon" className="rounded-xl h-12 w-12 shrink-0">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {species.map((s) => (
                  <div key={s} className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all group">
                    <span className="font-bold text-sm tracking-tight text-foreground/80">{s}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black">De-register Species?</AlertDialogTitle>
                          <AlertDialogDescription className="font-medium">
                            Removing "{s}" will strip this medical tag from your global operational registry.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                          <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSpecies(s)} className="bg-destructive text-white rounded-xl font-bold">Execute Purge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale pointer-events-none">
         <Command className="h-8 w-8 mb-4" />
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">DayOneVet Operational Control v2.1</p>
      </div>
    </div>
  );
}

