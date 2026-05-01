import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { QUESTION_POOL, MOCK_FLASHCARDS, MOCK_MODULES, MOCK_GUIDELINES, MOCK_RESOURCES, MOCK_PDFS } from '../data/mockData';

export async function seedInitialData() {
  if (!auth.currentUser || auth.currentUser.email !== 'sravan96mufc@gmail.com') {
    throw new Error('Unauthorized for seeding');
  }

  const collectionsToCheck = ['questions', 'flashcards', 'modules', 'guidelines', 'resources', 'pdfs'];
  
  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        console.log(`Seeding ${colName}...`);
        const batch = writeBatch(db);
        
        let data: any[] = [];
        if (colName === 'questions') data = QUESTION_POOL;
        if (colName === 'flashcards') data = MOCK_FLASHCARDS;
        if (colName === 'modules') data = MOCK_MODULES;
        if (colName === 'guidelines') data = MOCK_GUIDELINES;
        if (colName === 'resources') data = MOCK_RESOURCES;
        if (colName === 'pdfs') data = MOCK_PDFS;

        data.forEach((item) => {
          const docRef = doc(collection(db, colName), item.id);
          batch.set(docRef, { ...item, userId: 'system', createdAt: Date.now() });
        });

        await batch.commit();
        console.log(`${colName} seeded.`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colName);
    }
  }
}
