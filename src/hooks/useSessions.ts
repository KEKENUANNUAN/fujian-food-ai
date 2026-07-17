import { useState, useCallback } from 'react';
import { Session, Message } from '../types';

const STORAGE_KEY = 'fujian-food-sessions';
const MODELS_KEY = 'sessionModels';

function loadFromStorage(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    // 将 createdAt 字符串转回 Date 对象
    return sessions.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      messages: (s.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => loadFromStorage());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [sessionModels, setSessionModels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(MODELS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // 自动保存到 localStorage
  const updateAndSave = useCallback((updater: (prev: Session[]) => Session[]) => {
    setSessions(prev => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const fetchSessions = useCallback(() => {
    // 在线模式：从 localStorage 加载（已在初始化时完成）
  }, []);

  const loadSessionMessages = useCallback(async (_sessionId: string) => {
    // 在线模式：消息已随会话一起存储在 localStorage 中
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<string | null> => {
    let navigateTo: string | null = null;

    updateAndSave(prev => prev.filter(s => s.id !== sessionId));

    const remaining = sessions.filter(s => s.id !== sessionId);
    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        navigateTo = `/chat/${remaining[0].id}`;
        setCurrentSessionId(remaining[0].id);
      } else {
        navigateTo = '/';
        setCurrentSessionId(null);
      }
    }

    return navigateTo;
  }, [sessions, currentSessionId, updateAndSave]);

  const updateSessionModel = useCallback((sessionId: string, modelId: string) => {
    setSessionModels(prev => {
      const updated = { ...prev, [sessionId]: modelId };
      localStorage.setItem(MODELS_KEY, JSON.stringify(updated));
      return updated;
    });
    updateAndSave(prev => prev.map(s =>
      s.id === sessionId ? { ...s, model: modelId } : s
    ));
  }, [updateAndSave]);

  const addSession = useCallback((session: Session) => {
    updateAndSave(prev => [session, ...prev]);
    setCurrentSessionId(session.id);
  }, [updateAndSave]);

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    updateAndSave(prev => prev.map(s =>
      s.id === sessionId ? { ...s, ...updates } : s
    ));
  }, [updateAndSave]);

  const updateSessionMessages = useCallback((sessionId: string, updater: (messages: Message[]) => Message[]) => {
    updateAndSave(prev => prev.map(s =>
      s.id === sessionId ? { ...s, messages: updater(s.messages) } : s
    ));
  }, [updateAndSave]);

  return {
    sessions,
    setSessions: updateAndSave,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    sessionModels,
    fetchSessions,
    loadSessionMessages,
    deleteSession,
    updateSessionModel,
    addSession,
    updateSession,
    updateSessionMessages,
  };
}
