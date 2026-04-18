import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, historyKeymap, indentWithTab, history } from '@codemirror/commands';
import { autocompletion, acceptCompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { typstLanguage } from './typst-lang';

const typstKeywords = [
  'let', 'set', 'show', 'import', 'include',
  'if', 'else', 'for', 'while', 'return', 'break', 'continue',
  'context', 'none', 'auto', 'true', 'false',
];

const typstFunctions = [
  'text', 'par', 'page', 'align', 'block', 'box', 'stack',
  'grid', 'table', 'figure', 'image', 'rect', 'circle', 'line',
  'heading', 'list', 'enum', 'terms', 'link', 'ref', 'label',
  'emph', 'strong', 'underline', 'strike', 'overline',
  'sub', 'super', 'smallcaps', 'upper', 'lower',
  'math.equation', 'math.frac', 'math.sqrt', 'math.sum', 'math.integral',
  'raw', 'smartquote', 'footnote', 'cite', 'bibliography',
  'numbering', 'counter', 'state', 'locate', 'query',
  'rgb', 'luma', 'cmyk', 'color',
  'lorem', 'type', 'repr', 'eval', 'panic', 'assert',
];

function typstCompletion(context: CompletionContext): CompletionResult | null {
  // After #, suggest keywords and functions
  const hashMatch = context.matchBefore(/#[a-zA-Z_]*/);
  if (hashMatch) {
    const prefix = hashMatch.text.slice(1);
    const options = [
      ...typstKeywords.map(k => ({ label: '#' + k, type: 'keyword' as const })),
      ...typstFunctions.map(f => ({ label: '#' + f, type: 'function' as const, boost: -1 })),
    ].filter(o => o.label.startsWith('#' + prefix));

    if (options.length === 0) return null;
    return {
      from: hashMatch.from,
      options,
      validFor: /^#[a-zA-Z_]*/,
    };
  }

  return null;
}

export function createEditor(
  parent: HTMLElement,
  initialCode: string,
  onChange: (code: string) => void,
): EditorView {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString());
    }
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        history(),
        keymap.of([
          { key: 'Tab', run: acceptCompletion },
          indentWithTab,
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        typstLanguage,
        autocompletion({
          override: [typstCompletion],
          closeOnBlur: true,
        }),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace' },
          '.cm-gutters': { background: '#f8f9fb', borderRight: '1px solid #e0e1e6', color: '#8b8da3' },
          '.cm-activeLineGutter': { background: '#eeeef9' },
          '.cm-activeLine': { background: '#f5f5ff' },
          '&.cm-focused .cm-cursor': { borderLeftColor: '#5b5fc7' },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: '#d7d8ff' },
        }),
      ],
    }),
    parent,
  });

  return view;
}

export function setEditorContent(view: EditorView, content: string): void {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  });
}
