
export enum UserRole {
  ADMIN = 'ADMIN',
  PUBLISHER = 'PUBLISHER',
  EDITOR = 'EDITOR',
  READER = 'READER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string; // Added for auth simulation
}

export interface Article {
  id: string;
  title: string;
  summary: string; // Short format
  content: string; // HTML Content
  authorId: string;
  authorName: string;
  authorAvatar?: string; // Added for profile picture
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  category: string;
  createdAt: string;
  thumbnailUrl: string;
  isFeatured?: boolean; // Controls visibility in Home Slider
  isTrending?: boolean; // Controls visibility in Trending Sidebar
}

export interface Category {
  id: string;
  name: string;
  type: 'ARTICLE' | 'CLASSIFIED';
  count?: number; // Optional article/ad count for display
}

export interface Tag {
  id: string;
  name: string;
}

export interface Classified {
  id: string;
  title: string;
  content: string;
  location: string;
  price: string;
  contact: string;
  category: string;
  createdAt: string;
  status: 'ACTIVE' | 'CLOSED';
}

export interface Advertisement {
  id: string;
  clientName: string;
  imageUrl: string;
  link: string;
  placement: 'HEADER' | 'SIDEBAR' | 'IN-FEED';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CropRegion {
  id: string;
  title: string;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  linkedArticleId?: string;
}

export interface EPaperPage {
  id: string;
  date: string;
  pageNumber: number;
  imageUrl: string;
  regions?: CropRegion[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface WatermarkSettings {
  text: string;
  imageUrl: string;
  scale: number;
  showDate: boolean;
}

// --- COMMUNICATION TYPES ---
export interface Attachment {
  id: string;
  type: 'IMAGE' | 'FILE';
  url: string; // Base64 or URL
  name: string;
}

export interface Message {
  id: string;
  channel: string; // Changed to string to support DM channel IDs (e.g. "1-2") and "ANNOUNCEMENTS"
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  isSystem?: boolean; // For auto-generated alerts
}

export interface Mail {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  isRead: boolean;
}
