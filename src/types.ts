/**
 * 类型定义 - 精简版
 */

export interface Model {
  modelId: string;
  name: string;
  description?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Session {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
  messages: Message[];
}

export type Theme = 'light' | 'dark';
