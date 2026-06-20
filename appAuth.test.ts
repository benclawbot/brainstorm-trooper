import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('local no-auth application shell', () => {
  it('does not load or gate the application behind Google or Firebase authentication', () => {
    const app = read('./App.tsx');
    const html = read('./index.html');
    const packageJson = read('./package.json');

    expect(app).not.toMatch(/firebase|onAuthStateChanged|signOut|<Auth/i);
    expect(packageJson).not.toMatch(/google|firebase/i);
    expect(html).not.toMatch(/google|gstatic|cdn\.tailwindcss|importmap/i);
    expect(app).toContain("name: 'Local Architect'");
  });

  it('injects only the existing MINIMAX_API_KEY contract into the local build', () => {
    const viteConfig = read('./vite.config.ts');

    expect(viteConfig).toContain('process.env.MINIMAX_API_KEY');
    expect(viteConfig).not.toMatch(/GEMINI_API_KEY|process\.env\.API_KEY/);
  });
});
