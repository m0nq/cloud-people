export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  revenue: number;
  companies?: number; // Added companies field
}

export interface Project {
  id: string;
  title: string;
  description: string;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  // Additional fields for agents
  coreSkill?: string;
  compatibleApps?: string[];
  trainingHours?: number;
  accuracy?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  service: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastUsed: string | null;
}

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}