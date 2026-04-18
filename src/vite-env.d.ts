/// <reference types="vite/client" />

declare module '*.typ?raw' {
  const content: string;
  export default content;
}

interface TypstSnippet {
  setCompilerInitOptions(opts: { getModule: () => string }): void;
  setRendererInitOptions(opts: { getModule: () => string }): void;
  svg(opts: { mainContent: string }): Promise<string>;
  canvas(container: HTMLElement, opts: { mainContent: string; pixelPerPt?: number }): Promise<void>;
  pdf(opts: { mainContent: string }): Promise<Uint8Array>;
  vector(opts: { mainContent: string }): Promise<Uint8Array>;
}

declare var $typst: TypstSnippet;
