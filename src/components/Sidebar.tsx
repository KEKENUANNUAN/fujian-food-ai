import { Button, Tooltip } from 'tdesign-react';
import { AddIcon, DeleteIcon } from 'tdesign-icons-react';
import { Bot } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  sidebarOpen: boolean;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  sidebarOpen,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside
      className="flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden relative"
      style={{
        width: sidebarOpen ? 260 : 0,
        backgroundColor: 'var(--td-bg-color-container)',
        borderRight: sidebarOpen ? '1px solid var(--td-component-stroke)' : 'none',
      }}
    >
      {/* Logo 区域 */}
      <div className="h-14 px-4 flex items-center flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{
              background: 'linear-gradient(135deg, var(--td-brand-color), var(--td-brand-color-hover))',
              boxShadow: '0 4px 12px rgba(232, 97, 60, 0.3)',
            }}
          >
            <span className="text-white text-sm font-bold">{APP_CONFIG.nameInitial}</span>
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: 'var(--td-text-color-primary)' }}
          >
            {APP_CONFIG.name}
          </span>
        </div>
      </div>

      {/* 新对话按钮 */}
      <div className="px-3 pb-2">
        <Button
          icon={<AddIcon />}
          onClick={onNewChat}
          block
          style={{
            borderRadius: '12px',
            height: '40px',
            fontWeight: 500,
          }}
        >
          新对话
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {sessions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
            style={{ color: 'var(--td-text-color-placeholder)' }}
          >
            <Bot size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p className="text-xs">暂无对话记录</p>
            <p className="text-xs mt-1">点击上方按钮开始探索</p>
          </div>
        ) : (
          sessions.map(session => {
            const isActive = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                className={`session-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer group ${isActive ? 'active' : ''}`}
                style={{
                  backgroundColor: isActive ? 'var(--td-brand-color-light)' : 'transparent',
                  color: isActive ? 'var(--td-brand-color)' : 'var(--td-text-color-secondary)',
                }}
                onClick={() => onSelectSession(session.id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--td-bg-color-component-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="flex-1 truncate text-sm font-medium">
                  {session.title}
                </span>
                <Tooltip content="删除会话">
                  <Button
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    variant="text"
                    shape="circle"
                    size="medium"
                    icon={<DeleteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  />
                </Tooltip>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
