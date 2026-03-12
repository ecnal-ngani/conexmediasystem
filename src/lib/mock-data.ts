
export type Role = 'CEO' | 'ADMIN' | 'ANALYST' | 'OPERATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  preferences: string;
  avatarUrl: string;
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

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Jenkins',
    email: 's.jenkins@conex.private',
    role: 'CEO',
    preferences: 'I need high-level strategic summaries and global market impact analysis.',
    avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
  },
  {
    id: 'u2',
    name: 'Marcus Chen',
    email: 'm.chen@conex.private',
    role: 'ANALYST',
    preferences: 'I focus on financial trends, data visualization, and market analysis.',
    avatarUrl: 'https://picsum.photos/seed/marcus/200/200',
  }
];

export const AUTHORIZED_CONTENT: ContentItem[] = [
  {
    id: 'c1',
    title: 'Global Expansion Media Kit',
    description: 'High-definition assets and strategic narrative for the 2025 global rollout.',
    category: 'media',
    tags: ['branding', 'global', 'strategy'],
    requiredRole: 'CEO',
    content: 'The global expansion narrative focuses on sustainable infrastructure and AI-driven logistics...',
    thumbnail: 'https://picsum.photos/seed/media1/800/400'
  },
  {
    id: 'c2',
    title: 'Q3 Executive Briefing',
    description: 'A summarized view of performance metrics across all regional hubs.',
    category: 'report',
    tags: ['performance', 'metrics', 'Q3'],
    requiredRole: 'CEO',
    content: 'Quarterly growth exceeded expectations in the EMEA region by 12%...',
    thumbnail: 'https://picsum.photos/seed/media2/800/400'
  },
  {
    id: 'c3',
    title: 'Security Infrastructure 2025',
    description: 'A deep dive into the next-gen encryption protocols defending the gateway.',
    category: 'document',
    tags: ['security', 'tech', 'future'],
    requiredRole: 'ADMIN',
    content: 'Standardizing on quantum-resistant algorithms across all edge nodes...',
    thumbnail: 'https://picsum.photos/seed/media3/800/400'
  },
  {
    id: 'c4',
    title: 'Market Volatility Analysis',
    description: 'Video analysis of real-time market shifts and potential risk mitigation.',
    category: 'video',
    tags: ['market', 'risk', 'video'],
    content: 'The video outlines three core scenarios for market stabilization...',
    thumbnail: 'https://picsum.photos/seed/media4/800/400'
  }
];
