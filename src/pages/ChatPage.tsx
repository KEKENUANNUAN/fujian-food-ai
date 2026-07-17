import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Model, Session } from '../types';
import { NewChatView } from '../components/NewChatView';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';

interface ChatPageProps {
  currentSession: Session | undefined;
  models: Model[];
  selectedModel: string;
  isLoading: boolean;
  inputValue: string;
  onSendMessage: (message: string, onNavigate?: (path: string) => void) => void;
  onStop: () => void;
  onInputChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
}

export function ChatPage({
  currentSession,
  models,
  selectedModel,
  isLoading,
  inputValue,
  onSendMessage,
  onStop,
  onInputChange,
  onModelChange,
}: ChatPageProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSend = useCallback((message: string) => {
    if (!currentSession) {
      onSendMessage(message, (path) => navigate(path));
    } else {
      onSendMessage(message);
    }
  }, [currentSession, onSendMessage, navigate]);

  const showNewChatView = !currentSession || currentSession.messages.length === 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {showNewChatView ? (
          <NewChatView />
        ) : (
          <ChatMessages
            messages={currentSession!.messages}
            models={models}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>

      <ChatInput
        inputValue={inputValue}
        selectedModel={selectedModel}
        models={models}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={onStop}
        onChange={onInputChange}
        onModelChange={onModelChange}
      />
    </>
  );
}
