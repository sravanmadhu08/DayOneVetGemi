import { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  LogOut, 
  Calendar, 
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
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, logout, updateProfile, promoteToAdmin, promoteOtherToAdmin, user, globalSettings, updateGlobalSettings } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    specialty: profile?.specialty || '',
    institution: profile?.institution || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  
  // Super admin state
  const [targetUid, setTargetUid] = useState('');
  const [isPromotingOther, setIsPromotingOther] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      await promoteToAdmin();
      toast.success('You are now an administrator!');
    } catch (error) {
      toast.error('Promotion failed. Check console for details.');
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePromoteOther = async () => {
    if(!targetUid) return;
    setIsPromotingOther(true);
    try {
      await promoteOtherToAdmin(targetUid);
      toast.success('User promoted to admin successfully!');
      setTargetUid('');
    } catch (error) {
      toast.error('Failed to promote user.');
    } finally {
      setIsPromotingOther(false);
    }
  };

  const completedModules = Object.keys(profile?.progress || {}).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">Manage your veterinary professional identity.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              {isSaving ? <span className="animate-spin mr-2">...</span> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-primary/10 shadow-lg">
          <div className="h-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent w-full" />
          <CardHeader className="relative pb-0 px-8">
            <div className="absolute -top-16 left-8">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile?.photoURL || ''} />
                <AvatarFallback className="text-4xl bg-primary/10">{profile?.displayName?.[0] || 'V'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="pt-20 pb-4 space-y-1">
              {isEditing ? (
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="text-xl font-bold"
                  />
                </div>
              ) : (
                <>
                  <CardTitle className="text-3xl font-extrabold">{profile?.displayName}</CardTitle>
                  <CardDescription className="flex items-center text-base">
                    <Mail className="h-4 w-4 mr-2" /> {profile?.email}
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-8 py-8 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Specialty
                  </Label>
                  {isEditing ? (
                    <Input 
                      placeholder="e.g. Small Animal Surgery"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium text-lg">{profile?.specialty || 'Not specified'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Institution
                  </Label>
                  {isEditing ? (
                    <Input 
                      placeholder="e.g. Royal Veterinary College"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium text-lg">{profile?.institution || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Bio
                </Label>
                {isEditing ? (
                  <Textarea 
                    placeholder="Tell us about your background and interests..."
                    className="min-h-[120px]"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                ) : (
                  <p className="text-muted-foreground italic leading-relaxed">
                    {profile?.bio || 'You haven\'t added a bio yet. Click edit to tell the community about yourself.'}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-8 border-t">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Professional Progress
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border flex flex-col items-center text-center">
                  <Target className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-2xl font-bold">{profile?.quizStats?.completed || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Quizzes</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border flex flex-col items-center text-center">
                  <Flame className="h-5 w-5 text-orange-500 mb-1" />
                  <span className="text-2xl font-bold">{completedModules}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Modules</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border flex flex-col items-center text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-2xl font-bold">{profile?.quizStats?.averageScore || 0}%</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border flex flex-col items-center text-center">
                  <Calendar className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-2xl font-bold">{new Date(profile?.createdAt || 0).getFullYear()}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Joined</span>
                </div>
              </div>
            </div>
            
            {!profile?.isAdmin && !globalSettings?.isFreeMode && (
              <div className="pt-8 border-t">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg">Subscription Details</h4>
                      {profile?.subscriptionUntil && profile.subscriptionUntil > Date.now() ? (
                        <p className="text-sm text-muted-foreground">Active until {new Date(profile.subscriptionUntil).toLocaleDateString()} on the {profile.subscriptionPlan} plan.</p>
                      ) : (
                        <p className="text-sm text-destructive font-medium">Your subscription has expired or is missing.</p>
                      )}
                    </div>
                    <Link to="/subscribe">
                      <Button variant="default" className="whitespace-nowrap">Manage Subscription</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t">
              <Button variant="outline" onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
              
              {(!profile?.isAdmin && user?.email === 'sravan96mufc@gmail.com') ? (
                <Button variant="ghost" onClick={handlePromote} disabled={isPromoting} className="rounded-xl text-primary hover:bg-primary/5">
                   <ShieldCheck className="h-4 w-4 mr-2" /> 
                   {isPromoting ? 'Promoting...' : 'Promote Self to Admin'}
                </Button>
              ) : null}

              <div className="text-xs text-muted-foreground flex items-center sm:ml-auto mt-4 sm:mt-0">
                <Shield className="h-3 w-3 mr-1" /> Profile security managed by Vetica.
              </div>
            </div>

            {(profile?.isAdmin || user?.email === 'sravan96mufc@gmail.com') && (
              <div className="pt-8 border-t space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-primary mb-1">
                        <Settings className="h-5 w-5" /> Admin Control Panel
                     </h4>
                     <p className="text-sm text-muted-foreground">Manage platform content and databases.</p>
                   </div>
                   
                   <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg border">
                     <Label htmlFor="free-mode" className="font-bold cursor-pointer">App Free Mode</Label>
                     <Switch 
                        id="free-mode" 
                        checked={globalSettings?.isFreeMode ?? true} 
                        onCheckedChange={(val) => updateGlobalSettings({ isFreeMode: val })}
                     />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('Questions upload initiated')}>
                          Bulk Upload CSV
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Modules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('Module creator opened')}>
                          Add Module
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Flashcards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('Flashcard upload initiated')}>
                          Add Flashcards
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> PDF Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('PDF upload initiated')}>
                          Upload PDFs
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Guidelines</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('Guidelines editor opened')}>
                          Add Guidelines
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><LogOut className="h-4 w-4 text-primary" /> Databases</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="secondary" className="w-full text-xs" onClick={() => toast.success('Database connector opened')}>
                          Other Databases
                        </Button>
                      </CardContent>
                    </Card>
                 </div>
              </div>
            )}

            {user?.email === 'sravan96mufc@gmail.com' && (
              <div className="pt-8 border-t space-y-4">
                 <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" /> Super Admin Center
                 </h4>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      placeholder="Enter User UID to promote" 
                      value={targetUid} 
                      onChange={e => setTargetUid(e.target.value)} 
                      className="rounded-xl flex-1 h-12 text-sm"
                    />
                    <Button 
                      onClick={handlePromoteOther} 
                      disabled={isPromotingOther || !targetUid} 
                      className="rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                       Promote User
                    </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
