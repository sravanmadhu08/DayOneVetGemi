import { motion } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Stethoscope, Brain, GraduationCap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Landing() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Vetica</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={signIn}>Login</Button>
          <Button onClick={signIn}>Get Started</Button>
        </nav>
      </header>
      
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Master Veterinary Science with Vetica
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  The ultimate clinical companion for students and professionals. SRS Flashcards, quizzes, and interactive study modules in one place.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-x-4"
              >
                <Button size="lg" onClick={signIn} className="px-8 shadow-lg shadow-primary/20">
                  Join Now
                </Button>
                <Button size="lg" variant="outline">Learn More</Button>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <Search className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl font-bold">Drug Database</h3>
                <p className="text-sm text-center text-muted-foreground">Comprehensive searchable database with dosages and side effects.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <Brain className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl font-bold">Anki Flashcards</h3>
                <p className="text-sm text-center text-muted-foreground">Spaced repetition system to help you memorize complex concepts forever.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl font-bold">Interactive Quizzes</h3>
                <p className="text-sm text-center text-muted-foreground">Test your knowledge and track your professional growth over time.</p>
              </div>
               <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <Stethoscope className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl font-bold">Study Modules</h3>
                <p className="text-sm text-center text-muted-foreground">Deep dives into physiological concepts and diagnostic techniques.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-6 flex justify-center">
        <p className="text-xs text-muted-foreground">© 2026 Vetica. All rights reserved.</p>
      </footer>
    </div>
  );
}
