
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
}

export interface Device {
  id: string;
  profile_id: string;
  device_id: string;
  device_name: string;
  is_primary: boolean;
  status: 'APPROVED' | 'PENDING' | 'REVOKED';
  last_used_at: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  category: string;
  createdAt: string;
  thumbnailUrl: string;
  isFeatured?: boolean;
  isTrending?: boolean;
}

export interface CropRegion {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  isDeviceApproved: boolean;
  isLoading: boolean;
}

export interface WatermarkSettings {
  text: string;
  imageUrl: string;
  scale: number;
  showDate: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'ARTICLE' | 'CLASSIFIED';
  count: number;
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

export interface Attachment {
  id: string;
  type: 'IMAGE' | 'FILE';
  url: string;
  name: string;
}

export interface Message {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  isSystem: boolean;
  attachments?: Attachment[];
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
  createdAt: string;
  isRead: boolean;
  attachments?: Attachment[];
}
