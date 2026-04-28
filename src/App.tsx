import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/hooks/useAuth';
import Navbar from '@/src/components/layout/Navbar';
import Dashboard from '@/src/pages/Dashboard';
import Flashcards from '@/src/pages/Flashcards';
import StudyModules from '@/src/pages/StudyModules';
import ModuleDetail from '@/src/pages/ModuleDetail';
import QuizList from '@/src/pages/QuizList';
import QuizDetail from '@/src/pages/QuizDetail';
import Landing from '@/src/pages/Landing';
import Profile from '@/src/pages/Profile';
import ProgressTracker from '@/src/pages/ProgressTracker';
import BulkImportPage from '@/src/pages/BulkImportPage';
import { Toaster } from '@/components/ui/sonner';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/welcome" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex flex-col">
                    <Navbar />
                    <main className="flex-1 container mx-auto py-6 px-4">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/flashcards" element={<Flashcards />} />
                        <Route path="/modules" element={<StudyModules />} />
                        <Route path="/modules/:moduleId" element={<ModuleDetail />} />
                        <Route path="/quizzes" element={<QuizList />} />
                        <Route path="/quizzes/session" element={<QuizDetail />} />
                        <Route path="/progress" element={<ProgressTracker />} />
                        <Route path="/import" element={<BulkImportPage />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}
