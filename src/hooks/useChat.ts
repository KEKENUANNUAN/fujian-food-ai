import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Session } from '../types';
import { SYSTEM_PROMPT } from '../config';


const STORAGE_KEYS = {
  draftInput: 'draftInput',
};

interface UseChatOptions {
  currentSession: Session | undefined;
  currentSessionId: string | null;
  selectedModel: string;
  addSession: (session: Session) => void;
  updateSession: (session: string, updates: Partial<Session>) => void;
  updateSessionMessages: (sessionId: string, updater: (messages: Message[]) => Message[]) => void;
  updateSessionModel: (sessionId: string, modelId: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  setSessions: (updater: (prev: Session[]) => Session[]) => void;
}

export function useChat(options: UseChatOptions) {
  const {
    currentSession,
    currentSessionId,
    selectedModel,
    updateSessionModel,
    setCurrentSessionId,
    setSessions,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.draftInput) || '';
  });

  // 发送消息
  const sendMessage = useCallback(async (
    messageContent: string,
    onNavigate?: (path: string) => void
  ) => {
    if (!messageContent.trim() || isLoading) return;

    let sessionId = currentSessionId;

    // 如果没有当前会话，创建新会话
    if (!sessionId) {
      const newSession: Session = {
        id: uuidv4(),
        title: messageContent.slice(0, 30) + (messageContent.length > 30 ? '...' : ''),
        model: selectedModel,
        createdAt: new Date(),
        messages: []
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
      updateSessionModel(newSession.id, selectedModel);
      onNavigate?.(`/chat/${newSession.id}`);
    }

    const tempUserMessageId = uuidv4();
    const tempAssistantMessageId = uuidv4();

    const userMessage: Message = {
      id: tempUserMessageId,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: tempAssistantMessageId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      timestamp: new Date(),
      isStreaming: true,
    };

    // 添加用户消息和助手占位消息
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const newTitle = s.messages.length === 0
          ? messageContent.slice(0, 30) + (messageContent.length > 30 ? '...' : '')
          : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessage, assistantMessage]
        };
      }
      return s;
    }));

    setInputValue('');
    localStorage.removeItem(STORAGE_KEYS.draftInput);
    setIsLoading(true);

    try {
      // 构建消息上下文（系统提示 + 历史消息）
      const session = currentSession || { messages: [] };
      const history = session.messages
        .filter(m => m.content) // 过滤掉空内容的消息
        .map(m => ({ role: m.role, content: m.content }));

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: messageContent },
      ];

      // 通过后端代理调用 CodeBuddy API（同源，无 CORS 问题）
      // bypass-tunnel-reminder: 绕过 localtunnel 拦截页面
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`服务器错误 (${response.status}): ${errText.slice(0, 200)}`);
      }

      if (!response.body) {
        throw new Error('服务器无响应');
      }

      // 解析 SSE 流（后端自定义格式: type=text/done/error）
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);

            if (json.type === 'text' && json.content) {
              fullContent += json.content;

              setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === tempAssistantMessageId
                        ? { ...m, content: fullContent, model: selectedModel }
                        : m
                    )
                  };
                }
                return s;
              }));
            } else if (json.type === 'done') {
              // 后端可能返回修正后的最终内容（视频链接已处理）
              if (json.content) {
                fullContent = json.content;
                setSessions(prev => prev.map(s => {
                  if (s.id === sessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m =>
                        m.id === tempAssistantMessageId
                          ? { ...m, content: fullContent }
                          : m
                      )
                    };
                  }
                  return s;
                }));
              }
            } else if (json.type === 'error') {
              throw new Error(json.message || '服务器返回错误');
            }
          } catch (e) {
            // 如果是 throw 的错误，继续抛出
            if (e instanceof Error && e.message !== '忽略') throw e;
            // 忽略 JSON 解析错误
          }
        }
      }

      // 最终更新消息（视频链接已由服务端完成修正 + 真实B站视频搜索）
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === tempAssistantMessageId
                ? { ...m, content: fullContent, isStreaming: false }
                : m
            )
          };
        }
        return s;
      }));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : '发生未知错误';
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === tempAssistantMessageId
                ? { ...m, content: `错误: ${errorMsg}`, isStreaming: false }
                : m
            )
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentSessionId, selectedModel, updateSessionModel, setCurrentSessionId, setSessions, isLoading]);

  const handleStop = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    inputValue,
    setInputValue,
    sendMessage,
    handleStop,
  };
}
