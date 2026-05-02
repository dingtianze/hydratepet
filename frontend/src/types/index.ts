// Auth types
export interface LoginCredentials {
  phone: string;
  code: string;
}

export interface RegisterData {
  phone: string;
  nickname: string;
  weight: number;
  gender: 'male' | 'female' | 'other';
  workStartTime: string;
  workEndTime: string;
  petName: string;
}

export interface GuestUser {
  id: string;
  nickname: string;
  isGuest: true;
}

// User types
export interface User {
  id: string;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  dailyGoal: number; // ml
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  workStartTime?: string;
  workEndTime?: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pet types
export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';

export type PetMood = 'happy' | 'normal' | 'thirsty' | 'sad' | 'sleeping';

export type BodyType = 'slim' | 'normal' | 'chubby';

export interface PetVisual {
  bodyType: BodyType;
  colorPalette: string[];
  accessories: string[];
}

export interface Pet {
  id: string;
  name: string;
  stage: PetStage;
  growth: number;
  maxGrowth: number;
  bodyType: BodyType;
  colorPalette: string[];
  accessories: string[];
  mood: PetMood;
  health: number;
  nextEvolution: number;
  lastFed: string | null;
  // Legacy fields for compatibility
  type?: PetType;
  level?: number;
  exp?: number;
  hydration?: number;
  isSleeping?: boolean;
  unlockedTitles?: string[];
  currentTitle?: string | null;
  createdAt?: string;
}

export type PetType = 'cat' | 'dog' | 'rabbit' | 'bird' | 'hamster' | 'droplet';

// Backend API response for pet
export interface PetApiResponse {
  id: string;
  name: string;
  stage: PetStage;
  growth: number;
  maxGrowth: number;
  bodyType: BodyType;
  colorPalette: string[];
  accessories: string[];
  mood: PetMood;
  health: number;
  nextEvolution: number;
  lastFed: string | null;
}

export interface PetAccessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'collar' | 'toy';
  imageUrl: string;
  unlocked: boolean;
}

// Water Record types
export interface WaterRecord {
  id: string;
  userId: string;
  amount: number; // ml
  drinkTime: string;
  type: WaterType;
  petReaction?: string;
  createdAt: string;
}

export type WaterType = 'water' | 'tea' | 'coffee' | 'juice' | 'milk' | 'other';

// Achievement/Titles types
export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  unlockedAt?: string;
}

export interface UserStats {
  totalDrinkAmount: number;
  totalDrinkDays: number;
  currentStreak: number;
  longestStreak: number;
  weeklyData: WeeklyData[];
  achievements: Achievement[];
}

export interface WeeklyData {
  date: string;
  amount: number;
  goal: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  total: number;
}

// Notification types
export interface NotificationSettings {
  enabled: boolean;
  interval: number; // minutes
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  soundEnabled: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  language: 'zh' | 'en';
  notifications: NotificationSettings;
}
