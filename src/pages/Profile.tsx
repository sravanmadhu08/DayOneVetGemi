import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Edit2,
  Save,
  X,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Settings,
  Settings2,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const {
    profile,
    logout,
    updateProfile,
    promoteToAdmin,
    promoteOtherToAdmin,
    user,
    globalSettings,
    updateGlobalSettings,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    bio: profile?.bio || "",
    specialty: profile?.specialty || "",
    institution: profile?.institution || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Super admin state
  const [targetUid, setTargetUid] = useState("");
  const [isPromotingOther, setIsPromotingOther] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Identity updated successfully");
    } catch (error) {
      toast.error("Access denied. Synchronisation failure.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      await promoteToAdmin();
      toast.success("Privilege escalation successful");
    } catch (error) {
      toast.error("Promotion protocol rejected");
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePromoteOther = async () => {
    if (!targetUid) return;
    setIsPromotingOther(true);
    try {
      await promoteOtherToAdmin(targetUid);
      toast.success("Remote user promoted successfully");
      setTargetUid("");
    } catch (error) {
      toast.error("Execution failure");
    } finally {
      setIsPromotingOther(false);
    }
  };

  const completedModules = Object.keys(profile?.progress || {}).length;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
             User Management Layer
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Your Platform Profile</h1>
        </div>
        
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
          >
            <Edit2 className="h-4 w-4 mr-2" strokeWidth={3} /> Modify Identity
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="rounded-2xl h-12 px-6 font-bold border-2"
            >
              <X className="h-4 w-4 mr-2 text-destructive" /> Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px]" disabled={isSaving}>
              {isSaving ? "Syncing..." : "Commit Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="lg:col-span-8 space-y-8"
        >
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-primary/5 overflow-hidden">
             <div className="h-48 bg-muted/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
                <div className="absolute top-0 right-0 p-8">
                   <Badge variant="outline" className="bg-white/50 backdrop-blur-md border-primary/20 text-primary font-black uppercase tracking-[0.2em] text-[8px] py-1 px-3">
                      Clinician Certified
                   </Badge>
                </div>
             </div>
             <CardHeader className="relative px-10 pb-0 flex flex-col items-center sm:flex-row sm:items-end gap-8 -mt-16">
                <Avatar className="h-40 w-40 rounded-[2.5rem] border-8 border-background shadow-2xl">
                  <AvatarImage src={profile?.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="text-5xl font-black bg-primary/10 text-primary">
                    {profile?.displayName?.[0] || "V"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 pb-4 text-center sm:text-left">
                   {isEditing ? (
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Display Descriptor</Label>
                       <Input
                         value={formData.displayName}
                         onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                         className="text-2xl font-black h-12 px-4 rounded-xl border-none bg-muted/30 focus:bg-muted/50"
                       />
                     </div>
                   ) : (
                     <>
                        <h2 className="text-4xl font-black tracking-tight">{profile?.displayName}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                           <Mail className="h-3.5 w-3.5" /> {profile?.email}
                        </div>
                     </>
                   )}
                </div>
             </CardHeader>

             <CardContent className="p-10 space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                            <Briefcase className="h-3 w-3" /> Professional Specialty
                         </Label>
                         {isEditing ? (
                           <Input
                             value={formData.specialty}
                             onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                             className="rounded-xl h-11 border-none bg-muted/20 font-bold"
                             placeholder="e.g. Feline Internal Medicine"
                           />
                         ) : (
                           <p className="text-lg font-black text-foreground/80">{profile?.specialty || "Not Defined"}</p>
                         )}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                            <GraduationCap className="h-3 w-3" /> Clinical Institution
                         </Label>
                         {isEditing ? (
                           <Input
                             value={formData.institution}
                             onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                             className="rounded-xl h-11 border-none bg-muted/20 font-bold"
                             placeholder="e.g. Royal College of Veterinary"
                           />
                         ) : (
                           <p className="text-lg font-black text-foreground/80">{profile?.institution || "Independent"}</p>
                         )}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                         <UserIcon className="h-3 w-3" /> Clinical Narrative
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="min-h-[120px] rounded-2xl border-none bg-muted/20 font-medium text-sm leading-relaxed"
                          placeholder="Your professional background..."
                        />
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                           {profile?.bio || "No narrative established for this clinician identifier."}
                        </p>
                      )}
                   </div>
                </div>

                <div className="pt-10 border-t border-border/50">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                         <Trophy className="h-4 w-4 text-amber-500" /> Operational Metrics
                      </h3>
                      <Link to="/progress" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Full Analytics Repo</Link>
                   </div>
                   
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Quizzes", val: profile?.quizStats?.completed || 0, icon: Target, color: "text-blue-500" },
                        { label: "Modules", val: completedModules, icon: Flame, color: "text-orange-500" },
                        { label: "Accuracy", val: `${profile?.quizStats?.averageScore || 0}%`, icon: TrendingUp, color: "text-emerald-500" },
                        { label: "Cycle 1", val: new Date(profile?.createdAt || 0).getFullYear(), icon: LayoutGrid, color: "text-purple-500" },
                      ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-muted/10 border border-border/30 flex flex-col items-center text-center group hover:bg-muted/30 transition-all">
                           <stat.icon className={`h-5 w-5 mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                           <span className="text-2xl font-black tracking-tight">{stat.val}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="lg:col-span-4 space-y-6"
        >
          {/* Admin Command Center */}
          {(profile?.isAdmin || user?.email === "sravan96mufc@gmail.com") && (
             <Card className="rounded-[2.5rem] bg-foreground text-background shadow-2xl p-8 overflow-hidden relative group">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                         <ShieldCheck className="h-5 w-5" /> Admin Control
                      </h3>
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                         <span className="text-[8px] font-black uppercase">Free Mode</span>
                         <Switch
                           checked={globalSettings?.isFreeMode ?? true}
                           onCheckedChange={(val) => updateGlobalSettings({ isFreeMode: val })}
                           className="data-[state=checked]:bg-primary h-4 w-7 slide-in-from-left-0"
                         />
                      </div>
                   </div>

                   <div className="grid gap-3">
                      {[
                        { label: "Question Lab", path: "/admin/questions", icon: Target },
                        { label: "Module Engine", path: "/admin/modules", icon: Settings2 },
                        { label: "System Config", path: "/admin/settings", icon: LayoutGrid },
                      ].map((link, i) => (
                        <Link key={i} to={link.path}>
                           <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border-transparent transition-all group/btn">
                              <div className="flex items-center gap-3">
                                 <link.icon className="h-4 w-4 text-primary" />
                                 <span className="text-xs font-black uppercase tracking-widest">{link.label}</span>
                              </div>
                              <ArrowRight className="h-3 w-3 opacity-30 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" />
                           </Button>
                        </Link>
                      ))}
                   </div>
                </div>
                <Settings className="absolute -right-12 -bottom-12 h-40 w-40 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
             </Card>
          )}

          {/* Security & System */}
          <Card className="rounded-[2.5rem] border border-border/40 p-8 space-y-8 shadow-sm">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-muted-foreground">
                   <Shield className="h-3 w-3" /> Access Protocol
                </h3>
                <div className="p-5 rounded-[2rem] bg-muted/20 border border-border/50 space-y-4">
                   <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase opacity-40">Encryption Provider</Label>
                      <p className="text-xs font-black uppercase tracking-widest text-foreground/70">
                         {user?.providerData[0]?.providerId === 'password' ? 'Cipher Layer: Private' : 'OAuth: Nexus Sync'}
                      </p>
                   </div>
                   <div className="h-px bg-border/50" />
                   <div className="space-y-2">
                      <Label className="text-[8px] font-black uppercase opacity-40">Operational Identifier</Label>
                      <p className="text-[9px] font-mono font-bold break-all opacity-60 leading-none">{user?.uid}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <Button 
                   variant="outline" 
                   onClick={logout}
                   className="w-full h-14 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive shadow-lg shadow-destructive/5 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                >
                   <LogOut className="h-4 w-4 mr-2" /> De-authorize Session
                </Button>
                
                {!profile?.isAdmin && user?.email === "sravan96mufc@gmail.com" && (
                   <Button
                      variant="ghost"
                      onClick={handlePromote}
                      disabled={isPromoting}
                      className="w-full h-12 rounded-2xl text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[10px]"
                   >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {isPromoting ? "Escalating..." : "Elevate to Admin"}
                   </Button>
                )}
             </div>
          </Card>

          {/* Super Admin Center */}
          {user?.email === "sravan96mufc@gmail.com" && (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-6 rounded-[2rem] bg-muted/20 border border-dashed border-primary/30 space-y-4"
             >
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" /> Root Authority
                </h4>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Remote UID..."
                    value={targetUid}
                    onChange={(e) => setTargetUid(e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono bg-white border-transparent"
                  />
                  <Button
                    onClick={handlePromoteOther}
                    disabled={isPromotingOther || !targetUid}
                    size="sm"
                    className="rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Remote Promotion
                  </Button>
                </div>
             </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

const ArrowRight = ({ className, strokeWidth }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth || "2"} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

