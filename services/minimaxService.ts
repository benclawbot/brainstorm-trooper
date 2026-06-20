import { ChatMessage, Drop, Language, MindMapNode } from '../types';

const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/chat/completions';
const MINIMAX_MODEL = 'MiniMax-M3';
const EMPTY_RESPONSE_FALLBACK = "I'm sorry, I couldn't generate a response.";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface MiniMaxResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  base_resp?: { status_msg?: string };
}

interface ExpandedIdea {
  title: string;
  content: string;
  tags: string[];
}

const languageName = (lang: Language) => (lang === 'fr' ? 'French' : 'English');

function removeThinkingTrace(content: string): string {
  return content.replace(/<think>[\s\S]*?(?:<\/think>|$)\s*/gi, '').trim();
}

function parseJson<T>(content: string): T {
  const clean = removeThinkingTrace(content)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(clean) as T;
}

function normalizeNode(node: Partial<MindMapNode>, fallbackText: string): MindMapNode {
  return {
    id: node.id || crypto.randomUUID(),
    text: node.text || fallbackText,
    children: Array.isArray(node.children)
      ? node.children.map(child => normalizeNode(child, 'Untitled'))
      : [],
  };
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, character => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function createVisualDataUrl(title: string, concept: string): string {
  const wrapped = concept.match(/.{1,72}(?:\s|$)/g)?.slice(0, 6) || [concept];
  const lines = wrapped
    .map(
      (line, index) =>
        `<text x="64" y="${190 + index * 34}" fill="#cbd5e1" font-family="Segoe UI, sans-serif" font-size="21">${escapeXml(line.trim())}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <circle cx="1040" cy="120" r="220" fill="#6366f1" opacity=".18"/>
  <circle cx="160" cy="620" r="260" fill="#a855f7" opacity=".12"/>
  <text x="64" y="100" fill="#818cf8" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" letter-spacing="4">MINIMAX M3 VISUAL CONCEPT</text>
  <text x="64" y="150" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="38" font-weight="800">${escapeXml(title.slice(0, 54))}</text>
  ${lines}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export class MiniMaxService {
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: FetchLike;

  constructor(
    apiKey = process.env.MINIMAX_API_KEY,
    fetchImpl: FetchLike = globalThis.fetch,
  ) {
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl.bind(globalThis);
  }

  private async complete(system: string, prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is not set.');
    }

    const response = await this.fetchImpl(MINIMAX_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        thinking: { type: 'disabled' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });

    let data: MiniMaxResponse = {};
    try {
      data = (await response.json()) as MiniMaxResponse;
    } catch {
      // Gateways can return non-JSON bodies for upstream failures.
    }

    if (!response.ok) {
      const detail =
        data.error?.message ||
        data.base_resp?.status_msg ||
        response.statusText ||
        'Unknown error';
      throw new Error(`MiniMax request failed (${response.status}): ${detail}`);
    }

    return removeThinkingTrace(data.choices?.[0]?.message?.content || '') ||
      EMPTY_RESPONSE_FALLBACK;
  }

  private async completeJson<T>(system: string, prompt: string): Promise<T> {
    const firstAttempt = await this.complete(system, prompt);
    try {
      return parseJson<T>(firstAttempt);
    } catch {
      const repaired = await this.complete(
        'Repair the supplied content into valid JSON. Preserve its intended data and return JSON only, without Markdown fences or commentary.',
        firstAttempt,
      );
      return parseJson<T>(repaired);
    }
  }

  async expandIdea(content: string, lang: Language = 'en'): Promise<ExpandedIdea> {
    return this.completeJson<ExpandedIdea>(
      `Respond only in ${languageName(lang)}. Return valid JSON with string fields "title" and "content", plus a string array "tags".`,
      `Transform this idea into a concise, structured plan: "${content}". Return JSON only.`,
    );
  }

  async generateDeepMindMap(
    rootTopic: string,
    lang: Language = 'en',
  ): Promise<MindMapNode> {
    const result = await this.completeJson<Partial<MindMapNode>>(
      `Respond only in ${languageName(lang)}. Return a valid JSON mind-map node using fields "id", "text", and "children".`,
      `Create a three-level mind map for "${rootTopic}". Use exactly four strategic categories, each with exactly three sub-points. Return JSON only.`,
    );
    return normalizeNode(result, rootTopic);
  }

  async suggestSubBranches(
    topic: string,
    path: string[],
    lang: Language = 'en',
  ): Promise<string[]> {
    return this.completeJson<string[]>(
      `Respond only in ${languageName(lang)}. Return a valid JSON array of strings.`,
      `For "${topic}" within the root context "${path[0] || topic}", suggest 4-5 short related sub-concepts. Return JSON only.`,
    );
  }

  async researchIdea(topic: string, lang: Language = 'en') {
    const text = await this.complete(
      `Respond only in ${languageName(lang)}. Produce a careful research-style dossier in Markdown. Distinguish known facts from assumptions and do not invent citations or URLs.`,
      `Create an executive summary and key findings for: "${topic}".`,
    );
    return { text, links: [] as Array<{ title: string; url: string }> };
  }

  async generateVisual(prompt: string): Promise<string> {
    const concept = await this.complete(
      'Create a concise visual art direction. Describe composition, lighting, palette, focal subject, and mood in no more than 90 words.',
      `Visual concept: "${prompt}".`,
    );
    return createVisualDataUrl(prompt, concept);
  }

  async chatWithWorkspace(
    message: string,
    history: ChatMessage[],
    drops: Drop[],
  ): Promise<string> {
    const workspace =
      drops.length > 0
        ? JSON.stringify(drops.map(({ title, content, tags }) => ({ title, content, tags })))
        : 'The workspace is empty.';
    const conversation = history
      .slice(-12)
      .map(item => `${item.role}: ${item.text}`)
      .join('\n');
    return this.complete(
      `You are Brainstorm Trooper, a concise and practical creative partner. Use the workspace context when relevant.\nWorkspace: ${workspace}`,
      `${conversation ? `Conversation:\n${conversation}\n\n` : ''}User: ${message}`,
    );
  }
}

const minimaxService = new MiniMaxService();

export const expandIdea = minimaxService.expandIdea.bind(minimaxService);
export const generateDeepMindMap = minimaxService.generateDeepMindMap.bind(minimaxService);
export const suggestSubBranches = minimaxService.suggestSubBranches.bind(minimaxService);
export const researchIdea = minimaxService.researchIdea.bind(minimaxService);
export const generateVisual = minimaxService.generateVisual.bind(minimaxService);
export const chatWithWorkspace = minimaxService.chatWithWorkspace.bind(minimaxService);
