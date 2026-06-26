import type { Bundesland, Question } from './types';

// ⚠️ SAMPLE DATA — NOT THE OFFICIAL CATALOGUE.
// These few questions exist only so the app runs end-to-end during development.
// Replace this module with an import of the full, verified BAMF catalogue
// (300 general + 16 x 10 state questions) before using the app to actually
// prepare for the exam. Do not fabricate official questions or answers.
//
// Import seam: a seed script will eventually load the official catalogue into
// Vercel Postgres; `getAllQuestions()` is the single read point to swap.

const GENERAL: Question[] = [
  {
    id: 'g-001',
    number: 1,
    category: 'Grundrechte',
    bundesland: null,
    questionDe: 'Welche Farben hat die Flagge der Bundesrepublik Deutschland?',
    hintEn: 'Colours of the German flag.',
    options: ['Schwarz-Rot-Gold', 'Schwarz-Rot-Grün', 'Rot-Weiß-Schwarz', 'Blau-Weiß-Rot'],
    correctIndex: 0,
    sample: true,
  },
  {
    id: 'g-002',
    number: 2,
    category: 'Staat und Politik',
    bundesland: null,
    questionDe: 'Was ist die Hauptstadt der Bundesrepublik Deutschland?',
    hintEn: 'Capital of Germany.',
    options: ['München', 'Frankfurt am Main', 'Berlin', 'Bonn'],
    correctIndex: 2,
    sample: true,
  },
  {
    id: 'g-003',
    number: 3,
    category: 'Grundrechte',
    bundesland: null,
    questionDe:
      'Im deutschen Grundgesetz steht: „Die Würde des Menschen ist …“. Wie geht der Satz weiter?',
    hintEn: 'Article 1 of the Basic Law — human dignity is …',
    options: ['… unantastbar.', '… veränderbar.', '… begrenzt.', '… verhandelbar.'],
    correctIndex: 0,
    sample: true,
  },
  {
    id: 'g-004',
    number: 4,
    category: 'Staat und Politik',
    bundesland: null,
    questionDe: 'Wie viele Bundesländer hat die Bundesrepublik Deutschland?',
    hintEn: 'Number of federal states.',
    options: ['14', '15', '16', '17'],
    correctIndex: 2,
    sample: true,
  },
  {
    id: 'g-005',
    number: 5,
    category: 'Demokratie',
    bundesland: null,
    questionDe: 'Wie heißt das deutsche Parlament auf Bundesebene?',
    hintEn: 'Name of the federal parliament.',
    options: ['Bundesrat', 'Bundestag', 'Bundesversammlung', 'Landtag'],
    correctIndex: 1,
    sample: true,
  },
  {
    id: 'g-006',
    number: 6,
    category: 'Demokratie',
    bundesland: null,
    questionDe: 'Ab welchem Alter darf man in Deutschland den Bundestag wählen?',
    hintEn: 'Minimum age to vote in federal elections.',
    options: ['16 Jahre', '18 Jahre', '21 Jahre', '25 Jahre'],
    correctIndex: 1,
    sample: true,
  },
  {
    id: 'g-007',
    number: 7,
    category: 'Geschichte und Verantwortung',
    bundesland: null,
    questionDe: 'In welchem Jahr wurde die Berliner Mauer gebaut?',
    hintEn: 'Year the Berlin Wall was built.',
    options: ['1949', '1961', '1972', '1989'],
    correctIndex: 1,
    sample: true,
  },
  {
    id: 'g-008',
    number: 8,
    category: 'Geschichte und Verantwortung',
    bundesland: null,
    questionDe: 'An welchem Tag feiert Deutschland den „Tag der Deutschen Einheit“?',
    hintEn: 'Date of German Unity Day.',
    options: ['1. Mai', '9. November', '3. Oktober', '17. Juni'],
    correctIndex: 2,
    sample: true,
  },
  {
    id: 'g-009',
    number: 9,
    category: 'Staat und Politik',
    bundesland: null,
    questionDe: 'Wer wählt in Deutschland den Bundeskanzler / die Bundeskanzlerin?',
    hintEn: 'Who elects the Federal Chancellor.',
    options: ['Das Volk direkt', 'Der Bundestag', 'Der Bundespräsident', 'Der Bundesrat'],
    correctIndex: 1,
    sample: true,
  },
  {
    id: 'g-010',
    number: 10,
    category: 'Grundrechte',
    bundesland: null,
    questionDe: 'Welches Recht gehört zu den Grundrechten in Deutschland?',
    hintEn: 'Which is a basic right.',
    options: [
      'Recht auf Arbeit für jeden',
      'Meinungsfreiheit',
      'Recht auf ein eigenes Auto',
      'Recht auf bezahlten Urlaub im Ausland',
    ],
    correctIndex: 1,
    sample: true,
  },
];

const STATE: Question[] = [
  {
    id: 'berlin-001',
    number: 1,
    category: 'Bundesland Berlin',
    bundesland: 'Berlin',
    questionDe: 'Welches Wappentier hat das Bundesland Berlin?',
    hintEn: 'Heraldic animal of Berlin.',
    options: ['Adler', 'Löwe', 'Bär', 'Pferd'],
    correctIndex: 2,
    sample: true,
  },
  {
    id: 'berlin-002',
    number: 2,
    category: 'Bundesland Berlin',
    bundesland: 'Berlin',
    questionDe: 'Berlin ist gleichzeitig eine Stadt und ein …?',
    hintEn: 'Berlin is a city and also a …',
    options: ['Landkreis', 'Bundesland', 'Regierungsbezirk', 'Stadtteil'],
    correctIndex: 1,
    sample: true,
  },
  {
    id: 'berlin-003',
    number: 3,
    category: 'Bundesland Berlin',
    bundesland: 'Berlin',
    questionDe: 'Wie heißt das Parlament des Bundeslandes Berlin?',
    hintEn: 'Name of Berlin\u2019s state parliament.',
    options: [
      'Abgeordnetenhaus',
      'Landtag',
      'Bürgerschaft',
      'Senat',
    ],
    correctIndex: 0,
    sample: true,
  },
];

const ALL: Question[] = [...GENERAL, ...STATE];

/** Single read point for question data (swap to Postgres-backed source later). */
export function getAllQuestions(): Question[] {
  return ALL;
}

export function getGeneralQuestions(): Question[] {
  return GENERAL;
}

export function getStateQuestions(bundesland: Bundesland): Question[] {
  return STATE.filter((q) => q.bundesland === bundesland);
}

export function getQuestionById(id: string): Question | undefined {
  return ALL.find((q) => q.id === id);
}

export function getCategories(): string[] {
  return Array.from(new Set(ALL.map((q) => q.category))).sort();
}

export function getByCategory(category: string): Question[] {
  return ALL.filter((q) => q.category === category);
}

/** Whether any non-sample (official) data is loaded yet. */
export function isSampleOnly(): boolean {
  return ALL.every((q) => q.sample);
}
