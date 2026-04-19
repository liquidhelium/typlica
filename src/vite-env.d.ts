/// <reference types="vite/client" />

declare module '*.typ?raw' {
  const content: string;
  export default content;
}

interface TypstSnippetProvider {
  key: string;
  forRoles: string[];
  provides: unknown[];
}

interface TypstSnippet {
  setCompilerInitOptions(opts: { getModule: () => string }): void;
  setRendererInitOptions(opts: { getModule: () => string }): void;
  svg(opts: { mainContent: string }): Promise<string>;
  canvas(container: HTMLElement, opts: { mainContent: string; pixelPerPt?: number }): Promise<void>;
  pdf(opts: { mainContent: string }): Promise<Uint8Array>;
  vector(opts: { mainContent: string }): Promise<Uint8Array>;
  use(...providers: TypstSnippetProvider[]): void;
}

interface TypstSnippetConstructor {
  new(): TypstSnippet;
  preloadFontAssets(options?: { assets?: ('text' | 'cjk' | 'emoji')[] }): TypstSnippetProvider;
  preloadFontFromUrl(url: string): TypstSnippetProvider;
  preloadFontData(data: Uint8Array): TypstSnippetProvider;
}

declare var $typst: TypstSnippet;
declare var TypstSnippet: TypstSnippetConstructor;
