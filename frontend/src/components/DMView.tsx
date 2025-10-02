import { useEffect, useRef, useState } from 'react';
import { useDMStore } from '../store/dmStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { MessageSkeleton } from './Skeleton';

export default function DMView() {
  const { currentConversation, messages, setMessages, addMessage } = useDMStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = currentConversation
    ? messages[currentConversation.id] || []
    : [];

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['dm-messages', currentConversation?.id],
    queryFn: async () => {
      if (!currentConversation) return [];
      const res = await api.get(`/dm/${currentConversation.id}/messages`);
      return res.data.messages;
    },
    enabled: !!currentConversation,
  });

  useEffect(() => {
    if (messagesData && currentConversation) {
      setMessages(currentConversation.id, messagesData);
    }
  }, [messagesData, currentConversation]);

  useEffect(() => {
    if (!currentConversation) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewDM = (data: any) => {
      if (data.conversationId === currentConversation.id) {
        addMessage(currentConversation.id, data.message);
      }
    };

    socket.on('dm:new', handleNewDM);

    return () => {
      socket.off('dm:new', handleNewDM);
    };
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation) return;

    socketService.emit('dm:send', {
      conversationId: currentConversation.id,
      content: messageInput.trim(),
    });

    setMessageInput('');
  };

  const getConversationName = () => {
    if (!currentConversation) return '';
    if (currentConversation.name) return currentConversation.name;
    const otherParticipant = currentConversation.participants.find(
      (p: any) => p.userId !== user?.id
    );
    return otherParticipant?.user.username || 'Unknown User';
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
          <div className="font-semibold">{getConversationName()}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        ) : (
          conversationMessages.map((message) => {
          const isOwnMessage = message.senderId === user?.id;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div className={isOwnMessage ? 'items-end' : ''}>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {message.sender.firstName || message.sender.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.edited && <span className="text-xs text-gray-400">(edited)</span>}
                </div>
                <div
                  className={`mt-1 px-3 py-2 rounded-lg max-w-md ${
                    isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Message ${getConversationName()}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>
    </div>
  );
}
