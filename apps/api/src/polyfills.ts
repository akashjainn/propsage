// Minimal polyfills for Node 18 runtime so libraries depending on Web APIs
// work without blowing up. This must be imported BEFORE any other app imports.

// Keep this extremely lightweight; only add what we truly need.
// undici@7 expects a global `File` in some code paths on Node18.
if (typeof (globalThis as any).File === 'undefined') {
  // Provide a tiny stub that satisfies type checks. If your code actually
  // needs full File semantics, consider upgrading to Node 20+ or installing
  // a fuller polyfill (e.g., fetch-blob's File) and wiring it here.
  class FileStub {
    name: string
    lastModified: number
    type: string
    size: number
    constructor(_parts: any[] = [], name = 'file', options: { type?: string; lastModified?: number } = {}) {
      this.name = name
      this.type = options.type || ''
      this.lastModified = options.lastModified || Date.now()
      this.size = 0
    }
  }
  ;(globalThis as any).File = FileStub as any
  // eslint-disable-next-line no-console
  console.log('[Polyfill] Installed minimal global File stub')
}
