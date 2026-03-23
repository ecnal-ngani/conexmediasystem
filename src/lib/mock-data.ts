
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

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    systemId: 'CX-AD-01',
    name: 'Kyle Jarque',
    email: 'k.jarque@conex.private',
    role: 'ADMIN',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/kyle/200/200',
    status: 'Office',
    badges: ['🛡️']
  },
  {
    id: 'u2',
    systemId: 'CX-AD-02',
    name: 'Command Administrator',
    email: 'admin@conex.private',
    role: 'ADMIN',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/admin/200/200',
    status: 'Office',
    badges: ['🛡️']
  },
  {
    id: 'u3',
    systemId: 'CX-BM-01',
    name: 'Marcus Chen',
    email: 'm.chen@conex.private',
    role: 'BRAND_MANAGER',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/marcus/200/200',
    status: 'WFH',
    xp: 3200,
    points: 800
  },
  {
    id: 'u4',
    systemId: 'CX-ED-01',
    name: 'Employee User',
    email: 'employee@conex.private',
    role: 'EDITOR',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/emp/200/200',
    status: 'Office',
    xp: 2500,
    points: 500
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
    requiredRole: 'ADMIN',
    content: 'The global expansion narrative focuses on sustainable infrastructure and AI-driven logistics...',
    thumbnail: 'https://picsum.photos/seed/media1/800/400'
  }
];

export const PRODUCTION_DATA: ProductionItem[] = [
  {
    fileCode: 'VLM-260120-01',
    brand: 'CJC Eco Bag',
    contentIdea: 'Product showcase reel',
    status: 'In Production',
    priority: 'RUSH',
    artist: 'Artist',
    type: 'Video',
    platform: 'Instagram',
    dueDate: 'Feb 5',
    bm: 'Clark',
    canvasLink: '#'
  }
];
