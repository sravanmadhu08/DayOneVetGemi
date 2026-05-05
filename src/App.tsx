import {
  Suspense,
  lazy,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/src/hooks/useAuth";
import Navbar from "@/src/components/layout/Navbar";
import SubscriptionGuard from "@/src/components/SubscriptionGuard";
import { Toaster } from "@/components/ui/sonner";

const Dashboard = lazy(() => import("@/src/pages/Dashboard"));
const Flashcards = lazy(() => import("@/src/pages/Flashcards"));
const StudyModules = lazy(() => import("@/src/pages/StudyModules"));
const ModuleDetail = lazy(() => import("@/src/pages/ModuleDetail"));
const QuizList = lazy(() => import("@/src/pages/QuizList"));
const QuizDetail = lazy(() => import("@/src/pages/QuizDetail"));
const Landing = lazy(() => import("@/src/pages/Landing"));
const Profile = lazy(() => import("@/src/pages/Profile"));
const Subscribe = lazy(() => import("@/src/pages/Subscribe"));
const ProgressTracker = lazy(() => import("@/src/pages/ProgressTracker"));
const AdminModules = lazy(() => import("@/src/pages/AdminModules"));
const AdminQuestions = lazy(() => import("@/src/pages/AdminQuestions"));
const AdminSettings = lazy(() => import("@/src/pages/AdminSettings"));

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <LoadingScreen />
    );

  if (!user) return <Navigate to="/welcome" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/welcome" element={<Landing />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1 container mx-auto py-6 px-4">
                      <SubscriptionGuard>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/" element={<Navigate to="/dashboard" />} />
                          <Route path="/flashcards" element={<Flashcards />} />
                          <Route path="/modules" element={<StudyModules />} />
                          <Route
                            path="/modules/:moduleId"
                            element={<ModuleDetail />}
                          />
                          <Route path="/quizzes" element={<QuizList />} />
                          <Route
                            path="/quizzes/session"
                            element={<QuizDetail />}
                          />
                          <Route
                            path="/progress"
                            element={<ProgressTracker />}
                          />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/subscribe" element={<Subscribe />} />
                          <Route
                            path="/admin/modules"
                            element={<AdminModules />}
                          />
                          <Route
                            path="/admin/questions"
                            element={<AdminQuestions />}
                          />
                          <Route
                            path="/admin/settings"
                            element={<AdminSettings />}
                          />
                          <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                      </SubscriptionGuard>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
            </Routes>
          </Suspense>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}
