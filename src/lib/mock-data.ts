
export type Role = 'ADMIN' | 'ANALYST' | 'OPERATOR';

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
  category: 'document' | 'article' | 'video' | 'report';
  tags: string[];
  requiredRole?: Role;
  content: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Jenkins',
    email: 's.jenkins@conex.private',
    role: 'ADMIN',
    preferences: 'I am interested in high-level security protocols and network architecture.',
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
    title: 'Security Protocol V4.2',
    description: 'Updated guidelines for internal network security and firewall configuration.',
    category: 'document',
    tags: ['security', 'network', 'protocol'],
    requiredRole: 'ADMIN',
    content: 'Full text of the security protocol... confidential data follows...'
  },
  {
    id: 'c2',
    title: 'Q3 Financial Forecast',
    description: 'Comprehensive analysis of expected market movements for the third quarter.',
    category: 'report',
    tags: ['finance', 'forecast', 'analysis'],
    requiredRole: 'ANALYST',
    content: 'Detailed financial projections indicate a 5% growth in sector X...'
  },
  {
    id: 'c3',
    title: 'Operational Efficiency Guide',
    description: 'Best practices for streamlining daily operations and resource allocation.',
    category: 'article',
    tags: ['ops', 'efficiency', 'guide'],
    requiredRole: 'OPERATOR',
    content: 'Operational efficiency starts with clear communication channels...'
  },
  {
    id: 'c4',
    title: 'Incident Response Training',
    description: 'Video series on standard procedures during a network breach event.',
    category: 'video',
    tags: ['training', 'incident', 'response'],
    content: 'Training video metadata and transcripts for internal review...'
  },
  {
    id: 'c5',
    title: 'Macroeconomic Impact Study',
    description: 'A deep dive into global economic factors affecting private network logistics.',
    category: 'report',
    tags: ['economics', 'logistics', 'study'],
    requiredRole: 'ANALYST',
    content: 'Macroeconomic factors such as inflation and interest rates are key...'
  }
];
