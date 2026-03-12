
export type Role = 'CEO' | 'ADMIN' | 'ANALYST' | 'OPERATOR';

export interface User {
  id: string;
  systemId: string;
  name: string;
  email: string;
  role: Role;
  preferences: string;
  avatarUrl: string;
  status: 'Office' | 'WFH' | 'Offline';
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
    systemId: 'CX-CEO-01',
    name: 'Kyle Jarque',
    email: 'k.jarque@conex.private',
    role: 'CEO',
    preferences: 'High-level strategic summaries and agency-wide performance metrics.',
    avatarUrl: 'https://picsum.photos/seed/kyle/200/200',
    status: 'Office'
  },
  {
    id: 'u2',
    systemId: 'CX-AN-05',
    name: 'Marcus Chen',
    email: 'm.chen@conex.private',
    role: 'ANALYST',
    preferences: 'I focus on financial trends, data visualization, and market analysis.',
    avatarUrl: 'https://picsum.photos/seed/marcus/200/200',
    status: 'WFH'
  }
];

export const EMPLOYEES = [
  { name: 'Jhon', status: 'Office', icon: '⭐' },
  { name: 'Clark', status: 'WFH', icon: '🛡️' },
  { name: 'Louise', status: 'Offline', icon: '' },
  { name: 'Matthew', status: 'Office', icon: '⚡' },
  { name: 'Prince', status: 'WFH', icon: '' },
  { name: 'Trish', status: 'Office', icon: '⭐' },
  { name: 'Janella', status: 'Office', icon: '🛡️' },
  { name: 'Hanna', status: 'WFH', icon: '' },
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
  }
];
