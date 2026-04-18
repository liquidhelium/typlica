import pixelmatch from 'pixelmatch';

export interface DiffResult {
  type: 'match';
  diffCanvas: HTMLCanvasElement;
  matchPercentage: number;
  diffPixels: number;
  totalPixels: number;
}

export interface SizeMismatchResult {
  type: 'size-mismatch';
  currentSize: { width: number; height: number };
  expectedSize: { width: number; height: number };
}

export function computeDiff(
  currentCanvas: HTMLCanvasElement,
  expectedCanvas: HTMLCanvasElement,
): DiffResult | SizeMismatchResult {
  const cw = currentCanvas.width;
  const ch = currentCanvas.height;
  const ew = expectedCanvas.width;
  const eh = expectedCanvas.height;

  if (cw !== ew || ch !== eh) {
    return {
      type: 'size-mismatch',
      currentSize: { width: cw, height: ch },
      expectedSize: { width: ew, height: eh },
    };
  }

  const currentCtx = currentCanvas.getContext('2d')!;
  const expectedCtx = expectedCanvas.getContext('2d')!;

  const currentData = currentCtx.getImageData(0, 0, cw, ch);
  const expectedData = expectedCtx.getImageData(0, 0, cw, ch);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = cw;
  diffCanvas.height = ch;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffData = diffCtx.createImageData(cw, ch);

  const diffPixels = pixelmatch(
    currentData.data,
    expectedData.data,
    diffData.data,
    cw,
    ch,
    { threshold: 0.1, includeAA: false },
  );

  diffCtx.putImageData(diffData, 0, 0);

  const totalPixels = cw * ch;
  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

  return { type: 'match', diffCanvas, matchPercentage, diffPixels, totalPixels };
}
