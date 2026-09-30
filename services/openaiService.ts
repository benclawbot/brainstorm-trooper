import { ChatMessage, Drop, Language, MindMapNode, ChatReply, ResearchResult, Diagram } from '../types';

type FetchLike = typeof fetch;
export class OpenAIService {
  private fetchImpl: FetchLike;
  constructor(fetchImpl: FetchLike = globalThis.fetch) { this.fetchImpl = fetchImpl.bind(globalThis); }
  private async request<T>(action: string, payload: object): Promise<T> {
    const response = await this.fetchImpl('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The assistant could not complete this request.');
    return data.result as T;
  }
  expandIdea(content: string, lang: Language = 'en') {
    return this.request<{title: string; content: string; tags: string[]}>('expand', { content, lang });
  }
  generateDeepMindMap(rootTopic: string, lang: Language = 'en') {
    return this.request<MindMapNode>('mindmap', { content: rootTopic, lang });
  }
  suggestSubBranches(topic: string, path: string[], lang: Language = 'en') {
    return this.request<string[]>('branches', { content: topic, path, lang });
  }
  researchIdea(topic: string, lang: Language = 'en') {
    return this.request<ResearchResult>('research', { content: topic, lang });
  }
  generateVisual(content: string, lang: Language = 'en') {
    return this.request<Diagram>('diagram', { content, lang });
  }
  chatWithWorkspace(message: string, history: ChatMessage[], drops: Drop[], mindMap: MindMapNode | null = null, lang: Language = 'en') {
    return this.request<ChatReply>('chat', { content: message, history: history.slice(-12), drops, mindMap, lang });
  }
}
const service = new OpenAIService();
export const expandIdea = service.expandIdea.bind(service);
export const generateDeepMindMap = service.generateDeepMindMap.bind(service);
export const suggestSubBranches = service.suggestSubBranches.bind(service);
export const researchIdea = service.researchIdea.bind(service);
export const generateVisual = service.generateVisual.bind(service);
export const chatWithWorkspace = service.chatWithWorkspace.bind(service);
