import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Brain, GraduationCap, Search, Mail, Lock, User, ArrowRight, Loader2, BookOpen, Calculator, LayoutGrid, Zap, Activity } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              shape?: string;
              width?: number;
              text?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export default function Landing() {
  const { user, signIn, signInWithGoogleCredential, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health/');
        if (!response.ok) setBackendDown(true);
      } catch (e) {
        setBackendDown(true);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!showAuthModal || !googleButtonRef.current) return;
    if (!googleClientId) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            toast.error("Google did not return a credential");
            return;
          }
          try {
            await signInWithGoogleCredential(response.credential);
          } catch {
            // The auth hook already shows the error.
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        width: 320,
        text: authMode === "signup" ? "signup_with" : "signin_with",
      });
    };

    if (window.google) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript || document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [authMode, googleClientId, showAuthModal, signInWithGoogleCredential]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else if (authMode === 'signup') {
        if (!name) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
      } else {
        await resetPassword(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-primary/5 to-transparent blur-[120px] opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="px-6 h-20 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-xl z-[60] border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-lg shadow-primary/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground">
            DayOne<span className="text-primary italic">Vet</span>
          </span>
          {backendDown && (
            <div className="ml-4 flex flex-col">
              <div className="px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Backend Offline</span>
              </div>
              <span className="text-[8px] text-muted-foreground mt-1 ml-1 font-mono">Check server logs or CORS settings</span>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl font-bold hidden sm:flex" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>Sign In</Button>
          <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>Join Free</Button>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col items-center text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-4xl"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 backdrop-blur-md">
                  <Activity className="h-3 w-3" />
                  Clinical Protocol Engine v2.0
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-foreground">
                  The Gold Standard <br />
                  in <span className="text-primary italic">Vet Education.</span>
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl font-medium leading-relaxed opacity-80">
                  Master pharmacology, diagnostics, and patient care with our professional-grade clinical workspace. Built for doctors, by technology.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Button 
                  size="lg" 
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} 
                  className="px-12 h-16 rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/25 hover:scale-105 transition-all hover:shadow-primary/40 active:scale-95"
                >
                  Create Your Identity <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="px-12 h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs border-2 hover:bg-muted/50 transition-all">
                  Explore Labs
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="py-24 px-6 bg-muted/30 border-y border-border/50">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">Clinical Suite</h2>
                <p className="text-muted-foreground font-medium max-w-md">Everything you need to survive and thrive on day one of practice.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Certified Integration</span>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 md:grid-cols-12 md:grid-rows-2"
            >
              {/* Feature 1: Flashcards */}
              <motion.div variants={item} className="md:col-span-8 md:row-span-1 bg-background border border-border/50 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden group hover:shadow-2xl transition-all shadow-sm">
                <div className="flex-1 space-y-4">
                   <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <Brain className="h-7 w-7 text-indigo-500" />
                   </div>
                   <h3 className="text-2xl font-black">Spaced Repetition</h3>
                   <p className="text-muted-foreground font-medium leading-relaxed">Memorize drug doses, contraindications, and normal values forever with our advanced Anki-inspired engine.</p>
                </div>
                <div className="w-full md:w-64 h-48 bg-muted/40 rounded-3xl border border-border/30 rotate-12 group-hover:rotate-6 transition-transform flex items-center justify-center p-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                   <Activity className="h-10 w-10 text-indigo-500/20" />
                   <div className="absolute inset-x-4 bottom-4 h-2 rounded-full bg-indigo-500/20" />
                </div>
              </motion.div>

              {/* Feature 2: Quiz */}
              <motion.div variants={item} className="md:col-span-4 md:row-span-1 bg-primary text-primary-foreground rounded-[2.5rem] p-10 flex flex-col justify-between hover:shadow-2xl hover:shadow-primary/20 transition-all group">
                <Zap className="h-10 w-10 opacity-50 group-hover:scale-110 transition-transform" />
                <div className="space-y-3 pt-12">
                   <h3 className="text-2xl font-black leading-none">Flash Quiz</h3>
                   <p className="text-primary-foreground/80 font-bold text-sm">Real-time simulation Layer for diagnostic excellence.</p>
                </div>
              </motion.div>

              {/* Feature 3: Modules */}
              <motion.div variants={item} className="md:col-span-4 md:row-span-1 bg-background border border-border/50 rounded-[2.5rem] p-10 flex flex-col justify-between hover:shadow-2xl transition-all shadow-sm group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                   <BookOpen className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black tracking-tight">Structured Learning</h3>
                   <p className="text-muted-foreground font-medium text-sm leading-relaxed">Deep dives into pathophysiology and diagnostic imaging protocols.</p>
                </div>
              </motion.div>

              {/* Feature 4: Analytics */}
              <motion.div variants={item} className="md:col-span-8 md:row-span-1 bg-background border border-border/50 rounded-[2.5rem] p-10 flex items-center gap-8 hover:shadow-2xl transition-all shadow-sm group">
                 <div className="hidden sm:grid grid-cols-2 gap-2 shrink-0">
                    <div className="h-12 w-8 bg-muted rounded-t-lg group-hover:h-16 transition-all" />
                    <div className="h-16 w-8 bg-primary rounded-t-lg group-hover:h-12 transition-all" />
                    <div className="h-14 w-8 bg-muted rounded-t-lg group-hover:h-10 transition-all" />
                    <div className="h-10 w-8 bg-primary rounded-t-lg group-hover:h-14 transition-all" />
                 </div>
                 <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                       <LayoutGrid className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Performance Analytics</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">Visual insights that precisely identify clinical knowledge gaps before they impact performance.</p>
                 </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 overflow-hidden relative">
           <div className="absolute inset-0 bg-primary/5 -z-10" />
           <div className="max-w-[800px] mx-auto text-center space-y-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                Ready to elevate your <br />
                <span className="text-primary italic">clinical baseline?</span>
              </h2>
              <Button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                size="lg" 
                className="h-20 px-16 rounded-[40px] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-95"
              >
                Join DayOneVet Now
              </Button>
              <div className="flex items-center justify-center gap-8 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Professional Access</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Calculator className="h-3 w-3" /> Evidence Based</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><GraduationCap className="h-3 w-3" /> Accredited Standards</span>
              </div>
           </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-20 px-6 bg-background">
        <div className="max-w-[1200px] mx-auto grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
           <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary p-2 text-primary-foreground">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tighter">DayOneVet</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">Empowering the next generation of veterinary professionals through precision learning.</p>
           </div>
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Infrastructure</h4>
              <ul className="space-y-2 text-sm font-bold text-muted-foreground">
                 <li><Link to="/flashcards" className="hover:text-primary">Medical Deck</Link></li>
                 <li><Link to="/quizzes" className="hover:text-primary">Diagnostic Lab</Link></li>
                 <li><Link to="/modules" className="hover:text-primary">Clinical Library</Link></li>
              </ul>
           </div>
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm font-bold text-muted-foreground">
                 <li><Link to="/terms" className="hover:text-primary">Protocols</Link></li>
                 <li><Link to="/privacy" className="hover:text-primary">Data Integrity</Link></li>
                 <li><Link to="/about" className="hover:text-primary">Mission Control</Link></li>
              </ul>
           </div>
           <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Status</h4>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">All Systems Operational</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-8">© 2026 DayOneVet. Professional Grade.</p>
           </div>
        </div>
      </footer>

      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto pt-20 pb-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-[3rem] p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl font-black tracking-tight text-foreground">
                    {authMode === 'login' ? 'Authentication' : authMode === 'signup' ? 'Initialization' : 'Reset Access'}
                  </h2>
                  <p className="text-muted-foreground text-sm font-medium">
                    {authMode === 'login' ? 'Validate your clinical credentials' : authMode === 'signup' ? 'Deploy your medical identity' : 'Coordinate access recovery'}
                  </p>
                </div>

                <div className="space-y-5">
                  {googleClientId ? (
                    <div className="flex min-h-14 items-center justify-center" ref={googleButtonRef} />
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] border-2 hover:bg-muted/50 transition-all"
                      onClick={() => signIn()}
                    >
                      <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" referrerPolicy="no-referrer" />
                      Google Identity
                    </Button>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-card px-3 text-muted-foreground/50 font-black tracking-[0.3em]">
                        Standard Link
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-5">
                    {authMode === 'signup' && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Clinician Name</Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="John Doe"
                            className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold placeholder:font-medium placeholder:opacity-50"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Identifier (Email or Username)</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="text"
                          placeholder="doc@vetica.pro or admin"
                          className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold placeholder:font-medium placeholder:opacity-50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {authMode !== 'reset' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Cipher Key</Label>
                          {authMode === 'login' && (
                            <button 
                              type="button"
                              onClick={() => setAuthMode('reset')}
                              className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                            >
                              Forgotten?
                            </button>
                          )}
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="password"
                            className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                    <Button 
                      disabled={loading}
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 mt-4 active:scale-95 transition-transform"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                       authMode === 'login' ? 'Authorize Session' : 
                       authMode === 'signup' ? 'Finalize Profile' : 'Request Token'}
                    </Button>
                  </form>
                </div>

                <div className="text-center pt-2">
                  {authMode === 'login' ? (
                    <p className="text-xs font-bold text-muted-foreground">
                      New operative?{' '}
                      <button 
                        onClick={() => setAuthMode('signup')}
                        className="text-primary hover:underline"
                      >
                        Create Identity
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground">
                      Existing identity?{' '}
                      <button 
                        onClick={() => setAuthMode('login')}
                        className="text-primary hover:underline"
                      >
                        Authenticate
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

