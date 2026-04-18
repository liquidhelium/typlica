const COMPILER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm';
const RENDERER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.6.0/pkg/typst_ts_renderer_bg.wasm';

const PREAMBLE = `#set page(width: auto, height: auto, margin: 20pt)
#set text(size: 11pt)
`;

let initialized = false;

export async function initCompiler(): Promise<void> {
  if (initialized) return;

  await new Promise<void>((resolve, reject) => {
    if (typeof $typst !== 'undefined') {
      resolve();
      return;
    }
    const el = document.getElementById('typst');
    if (!el) {
      reject(new Error('typst script element not found'));
      return;
    }
    el.addEventListener('load', () => resolve());
    el.addEventListener('error', () => reject(new Error('Failed to load typst.ts')));
  });

  $typst.setCompilerInitOptions({ getModule: () => COMPILER_WASM });
  $typst.setRendererInitOptions({ getModule: () => RENDERER_WASM });

  // Warm up the compiler with a canvas render
  const tmp = document.createElement('div');
  await $typst.canvas(tmp, { mainContent: '' });
  initialized = true;
}

export async function renderToCanvas(
  container: HTMLElement,
  code: string,
): Promise<{ canvas: HTMLCanvasElement; error: null } | { canvas: null; error: string }> {
  try {
    container.innerHTML = '';
    await $typst.canvas(container, { mainContent: PREAMBLE + code });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      return { canvas: null, error: 'Canvas rendering produced no output' };
    }
    return { canvas, error: null };
  } catch (e) {
    return { canvas: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getPreamble(): string {
  return PREAMBLE;
}
