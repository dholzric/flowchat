import { useEffect, useRef } from 'react';
import { useChannelStore } from '../store/channelStore';
import { useMessageStore } from '../store/messageStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '../services/socket';

export default function MessageList() {
  const { currentChannel } = useChannelStore();
  const { messages, setMessages, addMessage, updateMessage, deleteMessage } = useMessageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelMessages = currentChannel ? messages[currentChannel.id] || [] : [];

  const { data: messagesData } = useQuery({
    queryKey: ['messages', currentChannel?.id],
    queryFn: async () => {
      if (!currentChannel) return [];
      const res = await api.get(`/messages/channel/${currentChannel.id}`);
      return res.data.messages;
    },
    enabled: !!currentChannel,
  });

  useEffect(() => {
    if (messagesData && currentChannel) {
      setMessages(currentChannel.id, messagesData);
    }
  }, [messagesData, currentChannel]);

  useEffect(() => {
    if (!currentChannel) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('channel:join', { channelId: currentChannel.id });

    const handleNewMessage = (message: any) => {
      if (message.channelId === currentChannel.id) {
        addMessage(currentChannel.id, message);
      }
    };

    const handleMessageUpdated = (message: any) => {
      if (message.channelId === currentChannel.id) {
        updateMessage(currentChannel.id, message.id, message);
      }
    };

    const handleMessageDeleted = (data: any) => {
      if (data.channelId === currentChannel.id) {
        deleteMessage(currentChannel.id, data.messageId);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.emit('channel:leave', { channelId: currentChannel.id });
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [currentChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a channel to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {channelMessages.map((message) => (
        <div key={message.id} className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">
                {message.author.firstName || message.author.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
              {message.edited && <span className="text-xs text-gray-400">(edited)</span>}
            </div>
            <div className="text-sm mt-1">{message.content}</div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
