
export type DropType = 'note' | 'image' | 'task' | 'search';
export type Language = 'en' | 'fr';

export interface Drop {
  id: string;
  type: DropType;
  content: string;
  title?: string;
  tags: string[];
  imageUrl?: string;
  links?: { title: string; url: string }[];
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
