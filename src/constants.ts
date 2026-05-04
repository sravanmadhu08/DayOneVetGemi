export const DEFAULT_MODULES = [
  {
    title: "Abdominal Imaging: Liver & Spleen",
    category: "Radiology",
    content: "# Abdominal Ultrasonography\nFocus on identifying common parenchymal changes and focal lesions in the liver and spleen.",
    order: 1,
    sections: [
      { title: "Introduction", content: "Ultrasound is the primary tool for evaluating abdominal organs in small animals." },
      { title: "Liver Evaluation", content: "Assess echogenicity compared to the spleen and falciform fat. Look for target lesions." }
    ]
  },
  {
    title: "Canine Mitral Valve Disease",
    category: "Cardiology",
    content: "# MMVD Overview\nDegenerative mitral valve disease is the most common heart disease in adult dogs.",
    order: 2,
    sections: [
      { title: "Pathophysiology", content: "Myxomatous degeneration leads to valve thickening and mitral regurgitation." },
      { title: "Staging (ACVIM)", content: "Stage B1 vs B2: The importance of cardiomegaly (VHS/VLAS) in treatment decisions." }
    ]
  },
  {
    title: "Status Epilepticus Protocols",
    category: "Neurology",
    content: "# Emergency Neurology\nRapid intervention is critical to prevent permanent neuronal damage.",
    order: 3,
    sections: [
      { title: "Stabilization", content: "Maintaining airway and checking venous blood gas/glucose." },
      { title: "Pharmacology", content: "Tier 1: Benzodiazepines (Diazepam 0.5mg/kg). Tier 2: Phenobarbital or Levetiracetam." }
    ]
  }
];

export const DEFAULT_QUESTIONS = [
  {
    question: "Which of the following is the most sensitive test for diagnosing Hypoadrenocorticism (Addison's) in dogs?",
    options: ["Baseline Cortisol", "ACTH Stimulation Test", "Low-Dose Dexamethasone Suppression Test", "Urine Cortisol:Creatinine Ratio"],
    correctAnswer: 1,
    explanation: "The ACTH stimulation test is the gold standard for diagnosing Addison's. Baseline cortisol < 2 ug/dL is a good screening test but lacks specificity.",
    species: ["Canine"],
    system: "Endocrinology",
    userId: null
  },
  {
    question: "A dog presents 2 hours after ingesting ethylene glycol. What is the preferred antidote if available?",
    options: ["Apomorphine", "4-Methylpyrazole (4-MP / Fomepizole)", "20% Ethanol", "Activated Charcoal"],
    correctAnswer: 1,
    explanation: "4-MP is the preferred antidote as it inhibits alcohol dehydrogenase without the CNS depression associated with ethanol. Charcoal is ineffective for small alcohols.",
    species: ["Canine"],
    system: "Toxicology",
    userId: null
  },
  {
    question: "What is the primary indicator of prognosis in a Grade II Mast Cell Tumor (Patnaik System)?",
    options: ["Tumor Size", "Mitotic Index", "Patient Age", "Breed"],
    correctAnswer: 1,
    explanation: "For Patnaik Grade II tumors, the mitotic index (specifically > 5 per 10 HPF) is highly predictive of shorter survival times and higher recurrence.",
    species: ["Canine", "Feline"],
    system: "Oncology",
    userId: null
  },
  {
    question: "Secondary hyperparathyroidism is most commonly associated with which chronic condition in cats?",
    options: ["Hyperthyroidism", "Chronic Renal Failure", "Diabetes Mellitus", "Hepatic Lipidosis"],
    correctAnswer: 1,
    explanation: "Chronic renal failure leads to phosphorus retention and decreased calcitriol, triggering PTH release.",
    species: ["Feline"],
    system: "Endocrinology",
    userId: null
  },
  {
    question: "Which of the following is the preferred site for intraosseous (IO) catheter placement in a kitten?",
    options: ["Proximal humerus", "Distal radius", "Proximal tibia", "Wings of the ileum"],
    correctAnswer: 2,
    explanation: "The proximal tibia is the most common and accessible site for IO access in neonates and small pediatric patients.",
    species: ["Feline", "Canine"],
    system: "Emergency",
    userId: null
  }
];
