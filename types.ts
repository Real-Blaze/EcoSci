
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

export type MissionType = 'botanist' | 'zoologist' | 'geologist' | 'ecologist';

export interface ChatSession {
  id: string;
  title: string;
  missionType?: MissionType;
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
  bio: string;
  specialization: string;
  avatar: string;
  xp: number; // Experience Points
  level: number;
  streakDays: number;
  lastLoginDate: string; // YYYY-MM-DD
  badges: Badge[];
  observationsCount: number;
}

// Social Types
export interface Post {
    id: number;
    userId: string;
    user: string;
    avatar: string;
    title: string;
    description: string;
    image: string;
    likes: number;
    comments: number;
    timestamp: string; // or number
    isLiked?: boolean;
    tags: string[];
}
