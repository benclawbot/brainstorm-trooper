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

  it('keeps the recursive tree centered with workspace streams in the right panel', () => {
    const app = read('./App.tsx');
    const mindMap = read('./components/MindMapPanel.tsx');

    expect(app).toContain('workspace-three-panel');
    expect(app).toContain('workspace-streams-panel');
    expect(mindMap).toContain('mind-map-center-panel');
  });

  it('removes the new stream and top-right local profile controls', () => {
    const sidebar = read('./components/ProjectSidebar.tsx');
    const header = read('./components/Header.tsx');

    expect(sidebar).not.toContain('New Stream');
    expect(header).not.toContain("user.name.split(' ')[0]");
    expect(header).not.toContain('user.photoUrl');
  });

  it('uses compact tree-scale typography for intelligence reports', () => {
    const dropCard = read('./components/DropCard.tsx');
    const dossier = read('./components/ResearchDossierSection.tsx');

    expect(dropCard).toContain('intelligence-report-content');
    expect(dossier).toContain('intelligence-report-content');
  });

  it('hydrates local content before persistence and keeps the bottom-left reset control', () => {
    const app = read('./App.tsx');
    const sidebar = read('./components/ProjectSidebar.tsx');

    expect(app).toContain('const [hasHydrated, setHasHydrated]');
    expect(app).toContain('if (!hasHydrated) return;');
    expect(sidebar).toContain('Clear Local Workspace');
  });

  it('uses the supplied hero banner for the empty workspace state', () => {
    const app = read('./App.tsx');

    expect(app).toContain('/assets/hero-banner.jpeg');
    expect(app).toContain('empty-workspace-hero');
    expect(app).not.toContain('Architect your ');
    expect(app).not.toContain('The intelligence hub in the header is ready for your first drop.');
  });
});
