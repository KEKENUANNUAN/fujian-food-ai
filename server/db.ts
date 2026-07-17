import path from 'path';
import fs from 'fs';

// 数据库文件路径
// 优先使用环境变量 DB_PATH（Electron 打包后传入 userData 路径）
// 开发模式默认使用项目根目录下的 data/chat.db
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'chat.db');

// 确保 data 目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ===== JSON 文件存储 =====
// 用 JSON 文件替代 SQLite，避免原生模块编译问题

interface JsonDB {
  sessions: DbSession[];
  messages: DbMessage[];
}

function loadDB(): JsonDB {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const data = JSON.parse(raw);
      return {
        sessions: data.sessions || [],
        messages: data.messages || [],
      };
    }
  } catch (e) {
    console.error('[DB] Failed to load, starting fresh:', e);
  }
  return { sessions: [], messages: [] };
}

function saveDB(data: JsonDB): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Failed to save:', e);
  }
}

// 内存中的数据（启动时从文件加载）
let store = loadDB();

// 类型定义
export interface DbSession {
  id: string;
  title: string;
  model: string;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
  tool_calls: string | null;
}

// ============= 会话操作 =============

// 获取所有会话
export function getAllSessions(): DbSession[] {
  return [...store.sessions].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at)
  );
}

// 获取单个会话
export function getSession(id: string): DbSession | undefined {
  return store.sessions.find(s => s.id === id);
}

// 创建会话
export function createSession(session: DbSession): DbSession {
  store.sessions.push(session);
  saveDB(store);
  return session;
}

// 更新会话
export function updateSession(id: string, updates: Partial<Pick<DbSession, 'title' | 'model' | 'sdk_session_id'>>): boolean {
  const idx = store.sessions.findIndex(s => s.id === id);
  if (idx === -1) return false;

  if (updates.title !== undefined) store.sessions[idx].title = updates.title;
  if (updates.model !== undefined) store.sessions[idx].model = updates.model;
  if (updates.sdk_session_id !== undefined) store.sessions[idx].sdk_session_id = updates.sdk_session_id;
  store.sessions[idx].updated_at = new Date().toISOString();

  saveDB(store);
  return true;
}

// 删除会话
export function deleteSession(id: string): boolean {
  const before = store.sessions.length;
  store.sessions = store.sessions.filter(s => s.id !== id);
  // 同时删除该会话的所有消息
  store.messages = store.messages.filter(m => m.session_id !== id);
  const changed = store.sessions.length < before;
  if (changed) saveDB(store);
  return changed;
}

// ============= 消息操作 =============

// 获取会话的所有消息
export function getMessagesBySession(sessionId: string): DbMessage[] {
  return store.messages
    .filter(m => m.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// 创建消息
export function createMessage(message: DbMessage): DbMessage {
  store.messages.push(message);
  // 更新会话的 updated_at
  const session = store.sessions.find(s => s.id === message.session_id);
  if (session) {
    session.updated_at = new Date().toISOString();
  }
  saveDB(store);
  return message;
}

// 更新消息内容
export function updateMessage(id: string, updates: Partial<Pick<DbMessage, 'content' | 'tool_calls'>>): boolean {
  const msg = store.messages.find(m => m.id === id);
  if (!msg) return false;

  if (updates.content !== undefined) msg.content = updates.content;
  if (updates.tool_calls !== undefined) msg.tool_calls = updates.tool_calls;

  saveDB(store);
  return true;
}

// 删除消息
export function deleteMessage(id: string): boolean {
  const before = store.messages.length;
  store.messages = store.messages.filter(m => m.id !== id);
  const changed = store.messages.length < before;
  if (changed) saveDB(store);
  return changed;
}

// 批量创建消息
export function createMessages(messages: DbMessage[]): void {
  store.messages.push(...messages);
  // 更新相关会话的 updated_at
  const sessionIds = new Set(messages.map(m => m.session_id));
  const now = new Date().toISOString();
  for (const sid of sessionIds) {
    const session = store.sessions.find(s => s.id === sid);
    if (session) session.updated_at = now;
  }
  saveDB(store);
}

// 清空所有数据
export function clearAllData(): void {
  store.sessions = [];
  store.messages = [];
  saveDB(store);
}

export default { getAllSessions, getSession, createSession, updateSession, deleteSession, getMessagesBySession, createMessage, updateMessage, deleteMessage, createMessages, clearAllData };
