import { Flashcard, StudyModule, Question } from '@/src/types';

export const QUESTION_POOL: Question[] = [
  {
    id: 'q1',
    question: 'Which heart sound corresponds to the closure of the atrioventricular valves?',
    options: ['S1', 'S2', 'S3', 'S4'],
    correctAnswer: 0,
    explanation: 'S1 marks the beginning of systole and is the sound of the mitral and tricuspid valves closing.',
    species: ['Canine', 'Feline', 'Equine'],
    system: 'Cardiology'
  },
  {
    id: 'q2',
    question: 'What is a common sign of left-sided congestive heart failure in dogs?',
    options: ['Ascites', 'Pulmonary Edema', 'Jugular Pulsation', 'Hepatic Congestion'],
    correctAnswer: 1,
    explanation: 'Left-sided failure leads to backup of blood into the pulmonary circulation, resulting in edema.',
    species: ['Canine'],
    system: 'Cardiology'
  },
  {
    id: 'q3',
    question: 'Which of the following is a classic clinical sign of hyperthyroidism in cats?',
    options: ['Weight gain', 'Weight loss despite polyphagia', 'Bradycardia', 'Hyperexcitability'],
    correctAnswer: 1,
    explanation: 'Cats with hyperthyroidism typically have an increased metabolic rate, leading to weight loss even with increased appetite.',
    species: ['Feline'],
    system: 'Endocrinology'
  },
  {
    id: 'q4',
    question: 'What is the most common cause of hyperadrenocorticism in dogs?',
    options: ['Adrenal tumor', 'Pituitary-dependent (PDH)', 'Iatrogenic', 'Ectopic ACTH'],
    correctAnswer: 1,
    explanation: 'Approximately 80-85% of canine Cushing\'s cases are pituitary-dependent.',
    species: ['Canine'],
    system: 'Endocrinology'
  },
  {
    id: 'q5',
    question: 'What is the "Gold Standard" for diagnosing feline infectious peritonitis (FIP)?',
    options: ['Rivalta test', 'Histopathology with immunohistochemistry', 'RT-PCR', 'Albumin:Globulin ratio'],
    correctAnswer: 1,
    explanation: 'Definitive diagnosis requires visualization of the virus within macrophages by IHC on biopsies.',
    species: ['Feline'],
    system: 'Infectious Disease'
  },
  {
    id: 'q6',
    question: 'In horses, what is the primary cause of "Choke"?',
    options: ['Esophageal obstruction', 'Tracheal collapse', 'Laryngeal paralysis', 'Nasal polyps'],
    correctAnswer: 0,
    explanation: 'Choke in equines refers to the obstruction of the esophagus, usually by feed material.',
    species: ['Equine'],
    system: 'Digestive'
  },
  {
    id: 'q7',
    question: 'Which parasite causes "Heartworm" disease in dogs?',
    options: ['Dirofilaria immitis', 'Toxocara canis', 'Ancylostoma caninum', 'Giardia lamblia'],
    correctAnswer: 0,
    explanation: 'Dirofilaria immitis is the nematode responsible for heartworm disease.',
    species: ['Canine', 'Feline'],
    system: 'Cardiology'
  },
  {
    id: 'q8',
    question: 'What is the characteristic clinical sign of "Laminitis" in horses?',
    options: ['Coughing', '"Sawhorse" stance', 'Nasal discharge', 'Polyuria'],
    correctAnswer: 1,
    explanation: 'Horses with laminitis often lean back onto their heels to relieve pressure on the toes, creating a "sawhorse" stance.',
    species: ['Equine'],
    system: 'Musculoskeletal'
  },
  {
    id: 'q9',
    question: 'Which of these is a common viral cause of upper respiratory infection in cats?',
    options: ['Feline Calicivirus', 'Feline Leukemia Virus', 'Feline Immunodeficiency Virus', 'Rabies'],
    correctAnswer: 0,
    explanation: 'Feline Calicivirus and Feline Herpesvirus-1 are the most common causes of feline respiratory disease complex.',
    species: ['Feline'],
    system: 'Respiratory'
  },
  {
    id: 'q10',
    question: 'What is the normal body temperature of a dog?',
    options: ['37.0 - 38.0°C', '38.3 - 39.2°C', '39.5 - 40.5°C', '36.5 - 37.5°C'],
    correctAnswer: 1,
    explanation: 'The normal rectal temperature for a dog is typically between 101.0 and 102.5°F (38.3 - 39.2°C).',
    species: ['Canine'],
    system: 'General'
  },
  {
    id: 'q11',
    question: 'Which of the following is commonly used to treat fleas in dogs and cats?',
    options: ['Amoxicillin', 'Fipronil', 'Prednisone', 'Insulin'],
    correctAnswer: 1,
    explanation: 'Fipronil is a broad-spectrum insecticide that belongs to the phenylpyrazole chemical family.',
    species: ['Canine', 'Feline'],
    system: 'Dermatology'
  },
  {
    id: 'q12',
    question: 'What is "Bloat" also known as in veterinary medicine?',
    options: ['GDV', 'CRF', 'IVDD', 'CHF'],
    correctAnswer: 0,
    explanation: 'GDV stands for Gastric Dilatation-Volvulus, a life-threatening condition in dogs.',
    species: ['Canine'],
    system: 'Digestive'
  }
];

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'f1',
    front: 'What is the most common cause of heart murmur in older small-breed dogs?',
    back: 'Myxomatous Mitral Valve Disease (MMVD), also known as Endocardiosis.',
    deck: 'Cardiology',
    createdAt: Date.now()
  },
  {
    id: 'f2',
    front: 'Which antibiotic class is associated with cartilage damage in growing dogs?',
    back: 'Fluoroquinolones (e.g., Enrofloxacin).',
    deck: 'Pharmacology',
    createdAt: Date.now()
  },
  {
    id: 'f3',
    front: 'What is the characteristic ECG finding in a dog with Hyperkalemia?',
    back: 'Tall/tented T-waves, prolonged PR interval, and loss of P-waves.',
    deck: 'Internal Medicine',
    createdAt: Date.now()
  },
  {
    id: 'f4',
    front: 'What is the classic "triple" therapy for feline arterial thromboembolism (FATE)?',
    back: 'Analgesia (opioids), Anticoagulants (heparin/clopidogrel), and treatment of underlying heart disease.',
    deck: 'Emergency',
    createdAt: Date.now()
  }
];

export const MOCK_MODULES: StudyModule[] = [
  {
    id: 'mod-1',
    title: 'Cardiology Basics',
    category: 'Physiology',
    content: '# Cardiology Basics\n\nUnderstanding cardiac cycles, heart sounds, and common murmurs in small animals...\n\n## Heart Sounds\n- S1: Closure of AV valves\n- S2: Closure of Semilunar valves\n- S3: Rapid ventricular filling\n- S4: Atrial contraction',
    order: 1
  },
  {
    id: 'mod-2',
    title: 'Radiology Interpretation',
    category: 'Diagnostics',
    content: '# Radiology Interpretation\n\nHow to read thoracic radiographs effectively using the systematized approach...',
    order: 2
  },
  {
    id: 'mod-3',
    title: 'Feline Internal Medicine',
    category: 'Internal Medicine',
    content: '# Feline Internal Medicine\n\nA deep dive into common feline ailments such as renal failure, hyperthyroidism, and diabetes.',
    order: 3
  },
  {
    id: 'mod-4',
    title: 'Equine Lameness',
    category: 'Orthopedics',
    content: '# Equine Lameness\n\nDiagnostic techniques for identifying causes of lameness in performance and leisure horses.',
    order: 4
  },
  {
    id: 'mod-5',
    title: 'Bovine Herd Health',
    category: 'Production',
    content: '# Bovine Herd Health\n\nPreventative medicine and management strategies for large animal production systems.',
    order: 5
  },
  {
    id: 'mod-6',
    title: 'Pharmacology Fundamentals',
    category: 'Pharmacology',
    content: '# Pharmacology Fundamentals\n\nMechanism of action and clinical applications of common veterinary drugs.',
    order: 6
  }
];

export const MOCK_PDFS = [
  { id: 'pdf-1', title: 'NAVLE Study Guide 2024', author: 'VetBoard', size: '2.4 MB', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 'pdf-2', title: 'AAHA Canine Vaccination Guidelines', author: 'AAHA', size: '1.1 MB', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 'pdf-3', title: 'Global Feline Health Report', author: 'ISFM', size: '3.8 MB', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 'pdf-4', title: 'Equine Anesthesia Protocol', author: 'BEVA', size: '1.5 MB', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
];

export const MOCK_GUIDELINES = [
  { 
    id: 'guide-1', 
    title: 'Clinical Practice Ethics', 
    content: 'Standard operating procedures for ethical veterinary practice including client communication and patient welfare...',
    category: 'Ethics'
  },
  { 
    id: 'guide-2', 
    title: 'Surgical Gowns & Draping', 
    content: 'Comprehensive guide on maintaining sterility in the operating theater through proper draping techniques...',
    category: 'Surgery'
  },
  { 
    id: 'guide-3', 
    title: 'Biosecurity Fundamentals', 
    content: 'Key principles for preventing the spread of infectious disease within a clinical setting...',
    category: 'Safety'
  },
];

export const MOCK_RESOURCES = [
  { 
    id: 'res-1', 
    title: 'VIN - Veterinary Information Network', 
    description: 'The largest online veterinary community for clinicians.',
    url: 'https://www.vin.com',
    type: 'Community'
  },
  { 
    id: 'res-2', 
    title: 'Merck Veterinary Manual', 
    description: 'Comprehensive reference for veterinary professionals.',
    url: 'https://www.merckvetmanual.com',
    type: 'Reference'
  },
  { 
    id: 'res-3', 
    title: 'AVMA Resources', 
    description: 'American Veterinary Medical Association official resources.',
    url: 'https://www.avma.org',
    type: 'Professional'
  },
];
