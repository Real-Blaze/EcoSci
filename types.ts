export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  groundingSupports?: any[];
  searchEntryPoint?: any;
  webSearchQueries?: string[];
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface GalleryItem {
  src: string;
  alt: string;
  sourceMessageId: string;
  timestamp: number;
  isUser: boolean;
  sourceUrl?: string; // For citation
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt?: number;
}

export interface UserProfile {
  name: string;
  streakDays: number;
  lastLoginDate: string; // YYYY-MM-DD
  badges: Badge[];
  observationsCount: number;
}