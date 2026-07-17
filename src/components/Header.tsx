import { Button, Tooltip, Tag } from 'tdesign-react';
import {
  RefreshIcon,
  SunnyIcon,
  MoonIcon,
  MenuFoldIcon,
  MenuUnfoldIcon,
} from 'tdesign-icons-react';
import { APP_CONFIG } from '../config';
import { Model, Session, Theme } from '../types';

interface HeaderProps {
  sidebarOpen: boolean;
  theme: Theme;
  currentSession: Session | undefined;
  models: Model[];
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onRefreshModels: () => void;
}

export function Header({
  sidebarOpen,
  theme,
  currentSession,
  models,
  onToggleSidebar,
  onToggleTheme,
  onRefreshModels,
}: HeaderProps) {
  const formatModelName = (modelId: string) => {
    const model = models.find(m => m.modelId === modelId);
    const name = model?.name || modelId;
    return name
      .replace(/^(Claude|GPT|Gemini|Kimi|DeepSeek|Qwen|GLM)\s*/i, '')
      .replace(/-/g, ' ')
      .trim() || name;
  };

  return (
    <header
      className="h-14 flex justify-between items-center px-4 flex-shrink-0 relative"
      style={{
        backgroundColor: 'var(--td-bg-color-container)',
        borderBottom: '2px solid var(--td-brand-color-light)',
      }}
    >
      {/* 底部渐变装饰线 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, var(--td-brand-color), var(--td-brand-color-hover), transparent 70%)',
          opacity: 0.5,
        }}
      />

      <div className="flex items-center gap-3">
        <Button
          variant="text"
          shape="circle"
          icon={sidebarOpen ? <MenuFoldIcon /> : <MenuUnfoldIcon />}
          onClick={onToggleSidebar}
        />
        <h1
          className="text-base font-semibold tracking-tight"
          style={{ color: 'var(--td-text-color-primary)' }}
        >
          {currentSession?.title || APP_CONFIG.name}
        </h1>
        {currentSession && (
          <Tag size="small" variant="outline">
            {formatModelName(currentSession.model)}
          </Tag>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Tooltip content={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <Button
            variant="text"
            shape="circle"
            icon={theme === 'light' ? <MoonIcon /> : <SunnyIcon />}
            onClick={onToggleTheme}
          />
        </Tooltip>
        <Tooltip content="刷新模型列表">
          <Button
            variant="text"
            shape="circle"
            icon={<RefreshIcon />}
            onClick={onRefreshModels}
          />
        </Tooltip>
      </div>
    </header>
  );
}
