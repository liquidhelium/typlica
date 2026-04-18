import type { Locale } from './i18n';

interface ExerciseMeta {
  title: string;
  description: string;
  instructions: string;
  hint: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  templateCode: string;
  answerCode: string;
  hint: string;
}

// Auto-discover all locale exercise files at build time via Vite glob imports.
// Directory layout: exercises/{locale}/{exercise-id}/{meta.json|answer.typ|template.typ}
//
// To add a new exercise: create the folder with those three files — no TypeScript changes needed.
// To add a new locale: create exercises/{locale}/ with its own exercise folders.
const allMeta = import.meta.glob<ExerciseMeta>(
  '../exercises/*/*/meta.json',
  { eager: true, import: 'default' }
);
const allAnswers = import.meta.glob<string>(
  '../exercises/*/*/answer.typ',
  { eager: true, as: 'raw' }
);
const allTemplates = import.meta.glob<string>(
  '../exercises/*/*/template.typ',
  { eager: true, as: 'raw' }
);

export function getExercisesForLocale(locale: Locale): Exercise[] {
  const prefix = `../exercises/${locale}/`;
  return Object.keys(allMeta)
    .filter(path => path.startsWith(prefix))
    .sort()
    .map(metaPath => {
      const dir = metaPath.slice(0, -'/meta.json'.length);
      const id = dir.slice(prefix.length);
      const meta = allMeta[metaPath];
      return {
        id,
        title: meta.title,
        description: meta.description,
        instructions: meta.instructions,
        hint: meta.hint,
        answerCode: allAnswers[`${dir}/answer.typ`] ?? '',
        templateCode: allTemplates[`${dir}/template.typ`] ?? '',
      };
    });
}

const STORAGE_KEY = 'typlica-progress';

interface Progress {
  [exerciseId: string]: {
    code: string;
    completed: boolean;
  };
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getSavedCode(exerciseId: string): string | null {
  const progress = loadProgress();
  return progress[exerciseId]?.code ?? null;
}

export function saveCode(exerciseId: string, code: string): void {
  const progress = loadProgress();
  if (!progress[exerciseId]) {
    progress[exerciseId] = { code, completed: false };
  } else {
    progress[exerciseId].code = code;
  }
  saveProgress(progress);
}

export function markCompleted(exerciseId: string): void {
  const progress = loadProgress();
  if (!progress[exerciseId]) {
    progress[exerciseId] = { code: '', completed: true };
  } else {
    progress[exerciseId].completed = true;
  }
  saveProgress(progress);
}

export function isCompleted(exerciseId: string): boolean {
  const progress = loadProgress();
  return progress[exerciseId]?.completed ?? false;
}

export function getCompletedCount(): number {
  const progress = loadProgress();
  return Object.values(progress).filter(p => p.completed).length;
}
