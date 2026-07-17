import { Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../config';

export function NewChatView() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-xl">
        {/* 装饰性 Emoji 背景 */}
        <div className="text-center mb-6 relative">
          <div
            className="absolute inset-0 flex items-center justify-center opacity-[0.04] text-[120px] select-none pointer-events-none"
            style={{ color: 'var(--td-brand-color)' }}
          >
            🍜
          </div>

          {/* Logo */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 mx-auto relative"
            style={{
              background: 'linear-gradient(135deg, var(--td-brand-color), var(--td-brand-color-hover))',
              boxShadow: '0 8px 32px rgba(232, 97, 60, 0.25)',
            }}
          >
            <span className="text-4xl font-bold text-white">{APP_CONFIG.nameInitial}</span>
          </div>

          {/* 标题 */}
          <h2
            className="text-2xl font-bold mb-2 tracking-tight"
            style={{ color: 'var(--td-text-color-primary)' }}
          >
            {APP_CONFIG.name}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--td-brand-color)' }} />
            <p
              className="text-sm"
              style={{ color: 'var(--td-text-color-secondary)' }}
            >
              探索福建非物质文化遗产美食的世界
            </p>
            <Sparkles size={16} style={{ color: 'var(--td-brand-color)' }} />
          </div>
        </div>

        {/* 快捷提问标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {['佛跳墙的历史', '沙县小吃有哪些', '福州鱼丸做法', '闽南美食推荐'].map(q => (
              <span
                key={q}
                className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--td-brand-color-light)',
                  color: 'var(--td-brand-color)',
                  border: '1px solid var(--td-brand-color-light)',
                }}
                title={`试试问：${q}`}
              >
                {q}
              </span>
            ))}
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="flex justify-center gap-4 mt-6 opacity-30 select-none pointer-events-none text-2xl">
          <span>🍜</span><span>🥟</span><span>🍵</span><span>🦐</span><span>🍲</span>
        </div>
      </div>
    </div>
  );
}
