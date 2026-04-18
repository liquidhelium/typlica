import './style.css';
import { initCompiler, renderToCanvas } from './compiler';
import { Exercise, getExercisesForLocale, getSavedCode, saveCode, markCompleted, isCompleted, getCompletedCount } from './exercises';
import { createEditor, setEditorContent } from './editor';
import { computeDiff } from './diff';
import { t, getLocale, setLocale, type Locale } from './i18n';
import type { EditorView } from '@codemirror/view';

let exercises: Exercise[] = [];
let currentExercise!: Exercise;
let editorView: EditorView | null = null;
let compileTimeout: ReturnType<typeof setTimeout> | null = null;
let expectedCanvasCache: Map<string, HTMLCanvasElement> = new Map();
let currentCanvasRef: HTMLCanvasElement | null = null;
let hintVisible = false;
let compilerReady = false;

function renderApp(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    ${compilerReady ? '' : `<div class="loading-overlay" id="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">${t('loading')}</div>
    </div>`}

    <header class="header">
      <div class="header-title">Typlica</div>
      <div class="header-progress">
        ${t('progress')}<span class="count" id="progress-count">${getCompletedCount()}</span> / ${exercises.length}
      </div>
      <button class="lang-btn" id="btn-lang">${t('switchLang')}</button>
    </header>

    <nav class="exercise-nav" id="exercise-nav">
      ${exercises.map((ex, i) => `
        <button class="nav-btn ${ex.id === currentExercise.id ? 'active' : ''} ${isCompleted(ex.id) ? 'completed' : ''}"
                data-index="${i}">
          ${isCompleted(ex.id) ? '<span class="check">✓</span>' : ''}${i + 1}. ${ex.title}
        </button>
      `).join('')}
    </nav>

    <div class="main-container" id="main-container">
      <div class="left-panel">
        <div class="exercise-info">
          <div class="exercise-title" id="exercise-title">${currentExercise.title}</div>
          <div class="exercise-instructions" id="exercise-instructions">${formatInstructions(currentExercise.instructions)}</div>
        </div>
        <div class="editor-container" id="editor-container"></div>
        <div class="hint-panel ${hintVisible ? 'visible' : ''}" id="hint-panel">
          💡 ${currentExercise.hint}
        </div>
        <div class="editor-actions">
          <button class="btn btn-primary" id="btn-check">${t('btnCheck')}</button>
          <button class="btn" id="btn-reset">${t('btnReset')}</button>
          <button class="btn" id="btn-answer">${t('btnAnswer')}</button>
          <button class="btn btn-hint" id="btn-hint">${t('btnHint')}</button>
        </div>
      </div>

      <div class="right-panel">
        <div class="preview-tab-bar" id="preview-tab-bar">
          <button class="preview-tab-btn active" data-tab="current">${t('tabCurrent')}</button>
          <button class="preview-tab-btn" data-tab="expected">${t('tabExpected')}</button>
          <button class="preview-tab-btn" data-tab="diff">${t('tabDiff')}</button>
        </div>
        <div class="preview-sections" id="preview-sections" data-tab="current">
          <div class="preview-section" id="preview-current">
            <div class="preview-label">${t('labelCurrent')}</div>
            <div class="preview-content" id="current-content">
              <div class="preview-placeholder">${t('placeholderCurrent')}</div>
            </div>
          </div>
          <div class="preview-section" id="preview-expected">
            <div class="preview-label">${t('labelExpected')}</div>
            <div class="preview-content" id="expected-content">
              <div class="preview-placeholder">${t('placeholderExpected')}</div>
            </div>
          </div>
          <div class="preview-section" id="preview-diff">
            <div class="preview-label">${t('labelDiff')}</div>
            <div class="preview-content" id="diff-content">
              <div class="preview-placeholder">${t('placeholderDiff')}</div>
            </div>
          </div>
        </div>
        <div class="match-status" id="match-status" style="display:none">
          <div class="match-bar">
            <div class="match-bar-fill" id="match-bar-fill" style="width:0%"></div>
          </div>
          <div class="match-text" id="match-text">—</div>
        </div>
      </div>
    </div>


  `;

  setupEventListeners();
  setupEditor();
}

function formatInstructions(text: string): string {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function setupEventListeners(): void {
  document.getElementById('exercise-nav')!.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement | null;
    if (!target) return;
    const index = parseInt(target.dataset.index!, 10);
    switchExercise(exercises[index]);
  });

  document.getElementById('btn-check')!.addEventListener('click', checkAnswer);
  document.getElementById('btn-reset')!.addEventListener('click', resetCode);
  document.getElementById('btn-answer')!.addEventListener('click', showAnswer);
  document.getElementById('btn-hint')!.addEventListener('click', toggleHint);

  document.getElementById('btn-lang')!.addEventListener('click', () => {
    const next: Locale = getLocale() === 'zh-CN' ? 'en' : 'zh-CN';
    setLocale(next);
    exercises = getExercisesForLocale(next);
    currentExercise = exercises[0];
    currentCanvasRef = null;
    expectedCanvasCache.clear();
    hintVisible = false;
    editorView?.destroy();
    renderApp();
    if (compilerReady) {
      compileExpected();
      const code = editorView?.state.doc.toString() ?? '';
      if (code.trim()) debouncedCompile(code);
    }
  });

  document.getElementById('preview-tab-bar')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.preview-tab-btn') as HTMLElement | null;
    if (!btn) return;
    switchMobileTab(btn.dataset.tab!);
  });
}

function switchMobileTab(tab: string): void {
  (document.getElementById('preview-sections')! as HTMLElement).dataset.tab = tab;
  document.querySelectorAll('.preview-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tab);
  });
}

function setupEditor(): void {
  const container = document.getElementById('editor-container')!;
  const savedCode = getSavedCode(currentExercise.id);
  const initialCode = savedCode ?? currentExercise.templateCode;

  editorView = createEditor(container, initialCode, (code) => {
    saveCode(currentExercise.id, code);
    debouncedCompile(code);
  });
}

function switchExercise(exercise: Exercise): void {
  if (exercise.id === currentExercise.id) return;
  currentExercise = exercise;
  hintVisible = false;

  // Update nav
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', exercises[i].id === exercise.id);
  });

  // Update exercise info
  document.getElementById('exercise-title')!.textContent = exercise.title;
  document.getElementById('exercise-instructions')!.innerHTML = formatInstructions(exercise.instructions);
  document.getElementById('hint-panel')!.textContent = '💡 ' + exercise.hint;
  document.getElementById('hint-panel')!.classList.remove('visible');

  // Update editor
  const savedCode = getSavedCode(exercise.id);
  setEditorContent(editorView!, savedCode ?? exercise.templateCode);

  // Reset previews
  currentCanvasRef = null;
  document.getElementById('current-content')!.innerHTML = `<div class="preview-placeholder">${t('placeholderCurrent')}</div>`;
  document.getElementById('diff-content')!.innerHTML = `<div class="preview-placeholder">${t('placeholderDiff')}</div>`;
  (document.getElementById('match-status')! as HTMLElement).style.display = 'none';

  // Compile expected and current
  compileExpected();
  const code = savedCode ?? exercise.templateCode;
  if (code.trim()) {
    debouncedCompile(code);
  }
}

function debouncedCompile(code: string): void {
  if (compileTimeout) clearTimeout(compileTimeout);
  compileTimeout = setTimeout(() => compileUserCode(code), 300);
}

async function compileUserCode(code: string): Promise<void> {
  if (!compilerReady) return;

  const container = document.getElementById('current-content')!;
  const result = await renderToCanvas(container, code);

  if (result.error) {
    currentCanvasRef = null;
    container.innerHTML = `<div class="preview-error">${escapeHtml(result.error)}</div>`;
  } else if (result.canvas) {
    currentCanvasRef = result.canvas;
    autoRunDiff();
  }
}

async function compileExpected(): Promise<void> {
  if (!compilerReady) return;

  const container = document.getElementById('expected-content')!;

  if (expectedCanvasCache.has(currentExercise.id)) {
    container.innerHTML = '';
    const cached = expectedCanvasCache.get(currentExercise.id)!;
    container.appendChild(cached);
    return;
  }

  container.innerHTML = `<div class="preview-placeholder">${t('compilingExpected')}</div>`;

  const result = await renderToCanvas(container, currentExercise.answerCode);
  if (result.error) {
    container.innerHTML = `<div class="preview-error">${t('answerCompileFailed')}: ${escapeHtml(result.error)}</div>`;
  } else if (result.canvas) {
    expectedCanvasCache.set(currentExercise.id, result.canvas);
    autoRunDiff();
  }
}

function autoRunDiff(): void {
  const expectedCanvas = expectedCanvasCache.get(currentExercise.id);
  if (!currentCanvasRef || !expectedCanvas) return;

  try {
    const diff = computeDiff(currentCanvasRef, expectedCanvas);
    const diffContainer = document.getElementById('diff-content')!;
    diffContainer.innerHTML = '';
    diffContainer.appendChild(diff.diffCanvas);

    updateMatchStatus(diff.matchPercentage);

    // On mobile, auto-switch to diff tab once diff is ready
    if (window.matchMedia('(max-width: 768px)').matches) switchMobileTab('diff');

    if (diff.matchPercentage >= 99.5) {
      markCompleted(currentExercise.id);
      updateProgressAndNav();
    }
  } catch (e) {
    console.error('Diff computation failed:', e);
  }
}

async function checkAnswer(): Promise<void> {
  if (!compilerReady) return;
  // Re-render user code then auto-diff
  await compileUserCode(editorView!.state.doc.toString());
}



function updateMatchStatus(percentage: number): void {
  const statusEl = document.getElementById('match-status')! as HTMLElement;
  statusEl.style.display = 'flex';

  const fillEl = document.getElementById('match-bar-fill')!;
  const textEl = document.getElementById('match-text')!;

  fillEl.style.width = percentage.toFixed(1) + '%';

  let colorClass: string;
  if (percentage >= 99.5) {
    fillEl.style.backgroundColor = 'var(--success)';
    colorClass = 'perfect';
  } else if (percentage >= 90) {
    fillEl.style.backgroundColor = 'var(--warning)';
    colorClass = 'close';
  } else {
    fillEl.style.backgroundColor = 'var(--error)';
    colorClass = 'far';
  }

  textEl.className = 'match-text ' + colorClass;
  textEl.textContent = percentage >= 99.5 ? t('perfectMatch') : percentage.toFixed(1) + '%';
}

function updateProgressAndNav(): void {
  document.getElementById('progress-count')!.textContent = String(getCompletedCount());
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    const ex = exercises[i];
    if (isCompleted(ex.id)) {
      btn.classList.add('completed');
      if (!btn.querySelector('.check')) {
        btn.innerHTML = `<span class="check">✓</span>${btn.textContent!.trim()}`;
      }
    }
  });
}

function resetCode(): void {
  setEditorContent(editorView!, currentExercise.templateCode);
  saveCode(currentExercise.id, currentExercise.templateCode);
}

function showAnswer(): void {
  setEditorContent(editorView!, currentExercise.answerCode);
  saveCode(currentExercise.id, currentExercise.answerCode);
}

function toggleHint(): void {
  hintVisible = !hintVisible;
  document.getElementById('hint-panel')!.classList.toggle('visible', hintVisible);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Bootstrap
async function init(): Promise<void> {
  exercises = getExercisesForLocale(getLocale());
  currentExercise = exercises[0];
  renderApp();

  try {
    await initCompiler();
    compilerReady = true;
    const loading = document.getElementById('loading');
    if (loading) loading.remove();

    await compileExpected();

    const code = editorView?.state.doc.toString() ?? '';
    if (code.trim()) {
      await compileUserCode(code);
    }
  } catch (e) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <div style="color: var(--error); font-size: 16px;">${t('loadFailed')}</div>
        <div style="color: var(--text-secondary); font-size: 13px; max-width: 400px; text-align: center;">
          ${escapeHtml(e instanceof Error ? e.message : String(e))}<br><br>
          ${t('loadFailedHint')}
        </div>
      `;
    }
  }
}

init();
