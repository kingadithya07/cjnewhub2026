
import { Article, EPaperPage, User, UserRole, Advertisement, WatermarkSettings, Category, Tag, Classified, Message, Mail } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@news.com', password: 'password', role: UserRole.ADMIN, avatar: 'https://picsum.photos/id/64/100/100' },
  { id: '2', name: 'Editor Dave', email: 'editor@news.com', password: 'password', role: UserRole.EDITOR, avatar: 'https://picsum.photos/id/65/100/100' },
  { id: '3', name: 'Publisher Sarah', email: 'pub@news.com', password: 'password', role: UserRole.PUBLISHER, avatar: 'https://picsum.photos/id/66/100/100' },
  { id: '4', name: 'Reader John', email: 'reader@news.com', password: 'password', role: UserRole.READER, avatar: 'https://picsum.photos/id/67/100/100' },
];

export const MOCK_SETTINGS: { watermark: WatermarkSettings } = {
  watermark: {
    text: 'NewsFlow E-Paper',
    imageUrl: '',
    scale: 1,
    showDate: true
  }
};

export const MOCK_CATEGORIES: Category[] = [
  // Article Categories
  { id: 'cat1', name: 'Technology', type: 'ARTICLE', count: 12 },
  { id: 'cat2', name: 'Business', type: 'ARTICLE', count: 8 },
  { id: 'cat3', name: 'Local', type: 'ARTICLE', count: 5 },
  { id: 'cat4', name: 'World', type: 'ARTICLE', count: 15 },
  { id: 'cat5', name: 'Automotive', type: 'ARTICLE', count: 3 },
  { id: 'cat6', name: 'Lifestyle', type: 'ARTICLE', count: 7 },
  
  // Classified Categories
  { id: 'clcat1', name: 'Real Estate', type: 'CLASSIFIED', count: 5 },
  { id: 'clcat2', name: 'Vehicles', type: 'CLASSIFIED', count: 3 },
  { id: 'clcat3', name: 'Jobs', type: 'CLASSIFIED', count: 8 },
  { id: 'clcat4', name: 'Electronics', type: 'CLASSIFIED', count: 12 },
  { id: 'clcat5', name: 'Services', type: 'CLASSIFIED', count: 4 },
  { id: 'clcat6', name: 'Home & Garden', type: 'CLASSIFIED', count: 6 },
  { id: 'clcat7', name: 'Miscellaneous', type: 'CLASSIFIED', count: 2 },
];

export const MOCK_TAGS: Tag[] = [
  { id: 'tag1', name: 'AI' },
  { id: 'tag2', name: 'Climate Change' },
  { id: 'tag3', name: 'Economy' },
  { id: 'tag4', name: 'EVs' },
  { id: 'tag5', name: 'Food' },
  { id: 'tag6', name: 'Politics' },
];

export const MOCK_CLASSIFIEDS: Classified[] = [
  {
    id: 'cl1',
    title: 'Vintage Camera for Sale',
    content: 'Excellent condition 35mm film camera. Comes with lens and strap.',
    location: 'Downtown',
    price: '$150',
    contact: '555-0123',
    category: 'Electronics',
    createdAt: '2023-10-28',
    status: 'ACTIVE'
  },
  {
    id: 'cl2',
    title: 'Apartment for Rent',
    content: '2 Bedroom, 1 Bath. Near Central Park. Utilities included.',
    location: 'Northside',
    price: '$1200/mo',
    contact: 'realtor@example.com',
    category: 'Real Estate',
    createdAt: '2023-10-27',
    status: 'ACTIVE'
  },
  {
    id: 'cl3',
    title: 'Office Desk & Chair',
    content: 'Moving out sale. Sturdy wooden desk and ergonomic chair.',
    location: 'West End',
    price: '$80',
    contact: '555-0999',
    category: 'Furniture', // Note: Make sure to map this to new categories if strictly enforcing or just display text
    createdAt: '2023-10-25',
    status: 'CLOSED'
  }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '101',
    title: 'The Future of AI in Journalism',
    summary: 'AI tools are rapidly changing how news is gathered and distributed.',
    content: `<p><strong>Artificial Intelligence</strong> is reshaping the landscape of modern journalism. From automated transcription services to sophisticated data analysis tools, newsrooms are becoming more efficient.</p><br/><p>However, this shift brings ethical challenges. Deepfakes and algorithmic bias are concerns that editors must navigate carefully. The role of the human journalist is evolving from simple reporting to complex analysis and fact-checking verification.</p><br/><p><em>"It is not about replacing journalists, but empowering them,"</em> says Dr. Alan Grant, a media researcher. The integration of AI allows for hyper-local news targeting and personalized content delivery, ensuring readers get the stories that matter most to them.</p>`,
    authorId: '2',
    authorName: 'Editor Dave',
    authorAvatar: 'https://picsum.photos/id/65/100/100',
    status: 'PUBLISHED',
    category: 'Technology',
    createdAt: '2023-10-25',
    thumbnailUrl: 'https://picsum.photos/id/1/800/600',
    isFeatured: true,
    isTrending: true
  },
  {
    id: '102',
    title: 'Local Markets See Uptick',
    summary: 'Small businesses report higher earnings this quarter.',
    content: '<p>Detailed report on local market statistics showing a <strong>15% increase</strong> in revenue across the board.</p>',
    authorId: '2',
    authorName: 'Editor Dave',
    authorAvatar: 'https://picsum.photos/id/65/100/100',
    status: 'PENDING',
    category: 'Business',
    createdAt: '2023-10-26',
    thumbnailUrl: 'https://picsum.photos/id/20/800/600',
    isFeatured: false,
    isTrending: false
  },
  {
    id: '103',
    title: 'City Park Renovations Complete',
    summary: 'The central park is finally open to the public after 6 months.',
    content: '<p>The city park has reopened with new amenities including:</p><ul><li>New playground equipment</li><li>Jogging tracks</li><li>Picnic areas</li></ul>',
    authorId: '2',
    authorName: 'Editor Dave',
    authorAvatar: 'https://picsum.photos/id/65/100/100',
    status: 'PUBLISHED',
    category: 'Local',
    createdAt: '2023-10-27',
    thumbnailUrl: 'https://picsum.photos/id/10/800/600',
    isFeatured: true,
    isTrending: true
  },
  {
    id: '104',
    title: 'Global Summit on Climate Action',
    summary: 'World leaders gather in Geneva to discuss immediate steps.',
    content: '<p>Full coverage of the climate summit...</p>',
    authorId: '3',
    authorName: 'Publisher Sarah',
    authorAvatar: 'https://picsum.photos/id/66/100/100',
    status: 'PUBLISHED',
    category: 'World',
    createdAt: '2023-10-28',
    thumbnailUrl: 'https://picsum.photos/id/28/800/600',
    isFeatured: true,
    isTrending: true
  },
  {
    id: '105',
    title: 'New Electric Vehicle Policies',
    summary: 'Government announces tax breaks for EV owners starting next month.',
    content: '<p>Analysis of the new transport policies...</p>',
    authorId: '2',
    authorName: 'Editor Dave',
    authorAvatar: 'https://picsum.photos/id/65/100/100',
    status: 'PUBLISHED',
    category: 'Automotive',
    createdAt: '2023-10-28',
    thumbnailUrl: 'https://picsum.photos/id/111/800/600',
    isFeatured: true,
    isTrending: false
  },
  {
    id: '106',
    title: 'Culinary Festival Hits Downtown',
    summary: 'A weekend of flavors awaits foodies in the city center.',
    content: '<p>Guide to the best stalls at the festival...</p>',
    authorId: '2',
    authorName: 'Editor Dave',
    authorAvatar: 'https://picsum.photos/id/65/100/100',
    status: 'PUBLISHED',
    category: 'Lifestyle',
    createdAt: '2023-10-29',
    thumbnailUrl: 'https://picsum.photos/id/292/800/600',
    isFeatured: true,
    isTrending: true
  }
];

export const MOCK_ADS: Advertisement[] = [
  {
    id: 'ad1',
    clientName: 'TechCorp Solutions',
    imageUrl: 'https://picsum.photos/id/119/300/250',
    link: '#',
    placement: 'SIDEBAR',
    status: 'ACTIVE'
  },
  {
    id: 'ad2',
    clientName: 'Local Coffee Roasters',
    imageUrl: 'https://picsum.photos/id/42/800/100',
    link: '#',
    placement: 'HEADER',
    status: 'ACTIVE'
  },
  {
    id: 'ad3',
    clientName: 'Spring Festival 2024',
    imageUrl: 'https://picsum.photos/id/76/300/250',
    link: '#',
    placement: 'IN-FEED',
    status: 'INACTIVE'
  }
];

export const MOCK_EPAPER: EPaperPage[] = [
  { 
    id: 'p1', 
    date: '2023-10-27', 
    pageNumber: 1, 
    imageUrl: 'https://picsum.photos/id/24/1200/1800',
    regions: [
      {
        id: 'r1',
        title: 'Future of AI',
        x: 10, y: 10, width: 80, height: 40,
        linkedArticleId: '101'
      }
    ]
  },
  { id: 'p2', date: '2023-10-27', pageNumber: 2, imageUrl: 'https://picsum.photos/id/28/1200/1800', regions: [] },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    channel: 'ANNOUNCEMENTS',
    senderId: '1',
    senderName: 'Admin User',
    senderRole: UserRole.ADMIN,
    senderAvatar: 'https://picsum.photos/id/64/100/100',
    content: 'Welcome to the new internal communication system! Please use the General channel for day-to-day coordination.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isSystem: false
  },
  {
    id: 'm2',
    channel: '1-2', // DM between Admin (1) and Dave (2)
    senderId: '2',
    senderName: 'Editor Dave',
    senderRole: UserRole.EDITOR,
    senderAvatar: 'https://picsum.photos/id/65/100/100',
    content: 'Has anyone reviewed the draft for the Climate Summit article?',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isSystem: false
  },
  {
    id: 'm3',
    channel: '1-2', // DM between Admin (1) and Dave (2)
    senderId: '1',
    senderName: 'Admin User',
    senderRole: UserRole.ADMIN,
    senderAvatar: 'https://picsum.photos/id/64/100/100',
    content: 'I am taking a look at it now Dave. Looks good so far.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isSystem: false
  }
];

export const MOCK_MAILS: Mail[] = [
  {
    id: 'mail1',
    senderId: '2',
    senderName: 'Editor Dave',
    senderEmail: 'editor@news.com',
    recipientId: '1',
    recipientName: 'Admin User',
    recipientEmail: 'admin@news.com',
    subject: 'Request for time off',
    content: 'Hi Admin,\n\nI would like to request time off next Friday for a personal appointment.\n\nThanks,\nDave',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: false
  },
  {
    id: 'mail2',
    senderId: '3',
    senderName: 'Publisher Sarah',
    senderEmail: 'pub@news.com',
    recipientId: '1',
    recipientName: 'Admin User',
    recipientEmail: 'admin@news.com',
    subject: 'Q4 Report Draft',
    content: 'Here is the draft for the Q4 performance report. Please review attached.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isRead: true
  }
];
