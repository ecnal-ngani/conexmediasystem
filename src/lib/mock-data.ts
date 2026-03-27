export type Role = 'ADMIN' | 'BRAND_MANAGER' | 'VIDEOGRAPHER' | 'EDITOR' | 'INTERN';

export interface User {
  id: string;
  systemId: string;
  name: string;
  email: string;
  role: Role;
  preferences: string;
  avatarUrl: string;
  status: 'Office' | 'WFH' | 'Offline';
  xp?: number;
  points?: number;
  badges?: string[];
  school?: string;
  course?: string;
  startDate?: string;
  expectedCompletionDate?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: 'document' | 'article' | 'video' | 'report' | 'media';
  tags: string[];
  requiredRole?: Role;
  content: string;
  thumbnail?: string;
}

export interface ProductionItem {
  fileCode: string;
  brand: string;
  contentIdea: string;
  status: 'In Production' | 'For QA' | 'Approved' | 'Client Revision';
  priority: 'RUSH' | 'REGULAR';
  artist: string;
  type: string;
  platform: string;
  dueDate: string;
  bm: string;
  canvasLink: string;
}

export const AUTHORIZED_CONTENT: ContentItem[] = [
  {
    id: 'c1',
    title: 'Global Expansion Media Kit',
    description: 'High-definition assets and strategic narrative for the 2025 global rollout.',
    category: 'media',
    tags: ['branding', 'global', 'strategy'],
    requiredRole: 'ADMIN',
    content: 'The global expansion narrative focuses on sustainable infrastructure and AI-driven logistics. This document outlines the key messaging pillars including technological sovereignty and environmental stewardship...',
    thumbnail: 'https://picsum.photos/seed/media1/800/400'
  }
];
