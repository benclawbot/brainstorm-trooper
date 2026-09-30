
export type DropType = 'note' | 'image' | 'task' | 'search';
export type Language = 'en' | 'fr';

export interface Drop {
  id: string;
  type: DropType;
  content: string;
  title?: string;
  tags: string[];
  imageUrl?: string;
  links?: ResearchSource[];
  researchedAt?: string;
  diagram?: Diagram;
  createdAt: number;
  folderId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface MindMapNode {
  id: string;
  text: string;
  children: MindMapNode[];
  parentId?: string;
  isCollapsed?: boolean;
}

export interface ResearchFolder {
  id: string;
  name: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  isExpanded?: boolean;
  parentId?: string;
}

export interface Project {
  id: string;
  name: string;
  drops: Drop[];
  mindMapRoot: MindMapNode | null;
  researchFolders?: ResearchFolder[];
  folderId?: string;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  retrievedAt?: string;
}
export interface ResearchResult {
  text: string;
  links: ResearchSource[];
  researchedAt: string;
}
export interface MapEdit {
  type: 'add' | 'rename' | 'move' | 'remove';
  nodeId: string;
  parentId: string | null;
  text: string | null;
  reason: string;
}
export interface ChatReply { text: string; edits: MapEdit[]; }
export interface Diagram {
  title: string;
  nodes: { id: string; label: string; detail: string }[];
  edges: { from: string; to: string; label: string }[];
}
