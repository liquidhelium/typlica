import PREAMBLE from '../exercises/preamble.typ?raw';

const COMPILER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm';
const RENDERER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.6.0/pkg/typst_ts_renderer_bg.wasm';

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
  await $typst.canvas(tmp, { mainContent: '', pixelPerPt: 3 });
  initialized = true;
}

export async function renderToCanvas(
  container: HTMLElement,
  code: string,
): Promise<{ canvas: HTMLCanvasElement; error: null } | { canvas: null; error: string }> {
  try {
    // Render into an offscreen temp container to avoid typst.ts injecting
    // semantic text overlays and inline styles into our visible DOM
    const tmp = document.createElement('div');
    await $typst.canvas(tmp, { mainContent: PREAMBLE + code, pixelPerPt: 3 });
    const srcCanvas = tmp.querySelector('canvas') as HTMLCanvasElement | null;
    if (!srcCanvas) {
      return { canvas: null, error: 'Canvas rendering produced no output' };
    }
    // Copy pixel data to a clean canvas so we don't carry typst.ts wrapper DOM
    const canvas = document.createElement('canvas');
    canvas.width = srcCanvas.width;
    canvas.height = srcCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(srcCanvas, 0, 0);

    container.innerHTML = '';
    container.appendChild(canvas);
    return { canvas, error: null };
  } catch (e) {
    return { canvas: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getPreamble(): string {
  return PREAMBLE;
}
