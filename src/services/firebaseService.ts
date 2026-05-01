import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudyModule, Question, Flashcard, UserProfile, FlashcardProgress } from '../types';

export const firebaseService = {
  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.uid}`);
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  // Questions
  async getQuestions(species?: string, system?: string): Promise<Question[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (species && species !== 'All') {
        constraints.push(where('species', 'array-contains', species));
      }
      if (system && system !== 'All') {
        constraints.push(where('system', '==', system));
      }
      
      const q = query(collection(db, 'questions'), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  },

  // Study Modules
  async getModules(): Promise<StudyModule[]> {
    try {
      const q = query(collection(db, 'modules'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyModule));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'modules');
      return [];
    }
  },

  // Flashcards
  async getFlashcards(userId?: string): Promise<Flashcard[]> {
    try {
      const qSystem = query(collection(db, 'flashcards'), where('userId', 'in', ['system', null]));
      const [sysSnap, userSnap] = await Promise.all([
        getDocs(qSystem),
        userId ? getDocs(query(collection(db, 'flashcards'), where('userId', '==', userId))) : Promise.resolve({ docs: [] })
      ]);
      
      const cards = [
        ...sysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard)),
        ...userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard))
      ];
      
      return Array.from(new Map(cards.map(c => [c.id, c])).values());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
      return [];
    }
  },

  // Flashcard Progress
  async getFlashcardProgress(uid: string): Promise<FlashcardProgress[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', uid, 'flashcardProgress'));
      return querySnapshot.docs.map(doc => doc.data() as FlashcardProgress);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/flashcardProgress`);
      return [];
    }
  },

  async updateFlashcardProgress(uid: string, progress: FlashcardProgress): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid, 'flashcardProgress', progress.cardId), progress);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/flashcardProgress/${progress.cardId}`);
    }
  }
};
