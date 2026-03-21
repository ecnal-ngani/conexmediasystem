
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
    systemId: 'CX-CEO-01',
    name: 'Kyle Jarque',
    email: 'k.jarque@conex.private',
    role: 'CEO',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/kyle/200/200',
    status: 'Office'
  },
  {
    id: 'u2',
    systemId: 'CX-AD-01',
    name: 'Command Administrator',
    email: 'admin@conex.private',
    role: 'ADMIN',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/admin/200/200',
    status: 'Office'
  },
  {
    id: 'u3',
    systemId: 'CX-AN-05',
    name: 'Marcus Chen',
    email: 'm.chen@conex.private',
    role: 'ANALYST',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/marcus/200/200',
    status: 'WFH'
  },
  {
    id: 'u4',
    systemId: 'CX-OP-01',
    name: 'Employee User',
    email: 'employee@conex.private',
    role: 'OPERATOR',
    preferences: '',
    avatarUrl: 'https://picsum.photos/seed/emp/200/200',
    status: 'Office'
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

export const PRODUCTION_DATA: ProductionItem[] = [
  {
    fileCode: 'VLM-260120-01',
    brand: 'CJC Eco Bag',
    contentIdea: 'Product showcase reel',
    status: 'In Production',
    priority: 'RUSH',
    artist: 'Jhon Lester Nolial',
    type: 'Video',
    platform: 'Instagram',
    dueDate: 'Feb 5',
    bm: 'Clark',
    canvasLink: '#'
  },
  {
    fileCode: 'VLM-260120-02',
    brand: 'Shimmer & Shield',
    contentIdea: 'Tutorial reel',
    status: 'For QA',
    priority: 'RUSH',
    artist: 'John Loyde Dalope',
    type: 'Video',
    platform: 'TikTok',
    dueDate: 'Feb 6',
    bm: 'Clark',
    canvasLink: '#'
  },
  {
    fileCode: 'VLM-260122-03',
    brand: 'Dentasmile',
    contentIdea: 'Before/After carousel',
    status: 'In Production',
    priority: 'REGULAR',
    artist: 'John Loyde Dalope',
    type: 'Graphic Design',
    platform: 'Instagram',
    dueDate: 'Feb 8',
    bm: 'Clark',
    canvasLink: '#'
  },
  {
    fileCode: 'VLM-260119-15',
    brand: 'Solarmaxx',
    contentIdea: 'Testimonial video',
    status: 'Approved',
    priority: 'REGULAR',
    artist: 'Daisy Atilano',
    type: 'Video',
    platform: 'Facebook',
    dueDate: 'Jan 31',
    bm: 'CA',
    canvasLink: '#'
  },
  {
    fileCode: 'VLM-260118-08',
    brand: 'Keto Lifestyle',
    contentIdea: 'Recipe animation',
    status: 'Client Revision',
    priority: 'REGULAR',
    artist: 'Andrei Capili',
    type: 'Motion Graphics',
    platform: 'Instagram',
    dueDate: 'Feb 4',
    bm: 'Janella',
    canvasLink: '#'
  }
];
