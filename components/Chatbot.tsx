
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
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  return (
    <div className={`fixed bottom-24 right-6 w-full max-w-md bg-gray-800 border border-cyan-500/30 rounded-lg shadow-2xl flex flex-col transition-transform duration-300 z-20 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <header className="flex items-center justify-between p-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-cyan-400">AI Assistant</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
          <CloseIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-1 p-4 overflow-y-auto h-96 max-h-[65vh]">
        <div className="flex flex-col gap-4">
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
                  className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'} ${isModel && isLong ? 'cursor-pointer' : ''}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{contentToShow}</p>
                  {isCollapsed && (
                    <span className="text-xs text-cyan-400 block mt-1">(Click to expand)</span>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-gray-700 text-gray-200">
                  <Spinner size="sm" />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-gray-700 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a quick question..."
          className="flex-1 bg-gray-900 border border-gray-600 rounded-full py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white rounded-full p-2">
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
