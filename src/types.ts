export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  isAdmin?: boolean;
  bio?: string;
  specialty?: string;
  institution?: string;
  subscriptionPlan?: string | null;
  subscriptionUntil?: number | null;
  progress?: {
    [moduleId: string]: {
      score: number;
      completedAt: number;
    };
  };
  quizStats?: {
    completed: number;
    averageScore: number;
    lastScore: number;
    totalQuestions: number;
    correctAnswers: number;
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  userId?: string;
  tags?: string[];
  createdAt: number;
}

export interface FlashcardProgress {
  cardId: string;
  interval: number;
  ease: number;
  nextReview: number;
  lastReviewed?: number;
  consecutiveCorrect: number;
}

export interface StudyModule {
  id: string;
  title: string;
  category: string;
  content: string; // Markdown
  order: number;
  sections?: { title: string; content: string; }[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  species: string[]; // e.g. ["Canine", "Feline"]
  system: string; // e.g. "Cardiology"
  sourceId?: string; // Reference to a PdfDocument id
}

export interface QuizSession {
  questions: Question[];
  config: {
    species: string;
    system: string;
    count: number;
    isTimed?: boolean;
    duration?: number | null;
  };
}

export interface GlobalSettings {
  isFreeMode: boolean;
  speciesOptions?: string[];
  systemOptions?: string[];
}

