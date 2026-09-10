
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import { CloseIcon, SendIcon } from './Icons';
import Spinner from './Spinner';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (input: string) => Promise<void>;
  isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Auto-collapse new long messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model') {
      const isLong = lastMessage.content.split('\n').length > 5 || lastMessage.content.length > 300;
      if (isLong) {
        setCollapsedMessages(prev => new Set(prev).add(lastMessage.id));
      }
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput('');
    await onSend(currentInput);
  };

  const handleToggleCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) newSet.delete(messageId);
      else newSet.add(messageId);
      return newSet;
    });
  };

  return (
    <div className={`fixed bottom-24 right-6 w-full max-w-md bg-white border border-eng-border rounded-lg shadow-2xl flex flex-col transition-transform duration-200 z-20 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <header className="flex items-center justify-between p-3 border-b border-eng-border bg-slate-50 rounded-t-lg">
        <h2 className="text-sm font-semibold text-eng-navy">Assistant</h2>
        <button onClick={onClose} className="p-1 rounded-full text-eng-muted hover:bg-slate-200 transition-colors">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 p-4 overflow-y-auto h-96 max-h-[65vh] custom-scrollbar">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-sm text-eng-muted text-center py-6">Ask a quick question about this project.</p>
          )}
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            const isLong = msg.content.split('\n').length > 5 || msg.content.length > 300;
            const isCollapsed = isModel && isLong && collapsedMessages.has(msg.id);

            const contentToShow = isCollapsed
              ? `${msg.content.substring(0, 100)}...`
              : msg.content;

            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  onClick={() => isModel && isLong && handleToggleCollapse(msg.id)}
                  className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-eng-navy text-white' : 'bg-slate-100 text-eng-ink'} ${isModel && isLong ? 'cursor-pointer' : ''}`}
                >
                  <p className="whitespace-pre-wrap">{contentToShow}</p>
                  {isCollapsed && (
                    <span className="text-xs text-eng-accent block mt-1">Click to expand</span>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-slate-100">
                <Spinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-eng-border flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a quick question..."
          className="flex-1 eng-input rounded-full text-sm"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="bg-eng-navy hover:bg-eng-navy-soft disabled:bg-slate-300 text-white rounded-full p-2 transition-colors">
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
