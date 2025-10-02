import { useEffect, useRef } from 'react';
import { useChannelStore } from '../store/channelStore';
import { useMessageStore } from '../store/messageStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import MessageReactions from './MessageReactions';
import { renderMentionedText } from '../utils/mentions';

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

    const handleReactionAdded = (data: any) => {
      if (data.reaction.message.channelId === currentChannel.id) {
        const channelMsgs = messages[currentChannel.id] || [];
        const msgIndex = channelMsgs.findIndex(m => m.id === data.messageId);
        if (msgIndex !== -1) {
          const updatedMessages = [...channelMsgs];
          updatedMessages[msgIndex] = {
            ...updatedMessages[msgIndex],
            reactions: [...(updatedMessages[msgIndex].reactions || []), data.reaction],
          };
          setMessages(currentChannel.id, updatedMessages);
        }
      }
    };

    const handleReactionRemoved = (data: any) => {
      if (messages[currentChannel.id]) {
        const channelMsgs = messages[currentChannel.id];
        const msgIndex = channelMsgs.findIndex(m => m.id === data.messageId);
        if (msgIndex !== -1) {
          const updatedMessages = [...channelMsgs];
          updatedMessages[msgIndex] = {
            ...updatedMessages[msgIndex],
            reactions: (updatedMessages[msgIndex].reactions || []).filter(
              r => !(r.user.id === data.userId && r.emoji === data.emoji)
            ),
          };
          setMessages(currentChannel.id, updatedMessages);
        }
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);

    return () => {
      socket.emit('channel:leave', { channelId: currentChannel.id });
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
    };
  }, [currentChannel, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const handleAddReaction = (messageId: string, emoji: string) => {
    socketService.emit('reaction:add', { messageId, emoji });
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    socketService.emit('reaction:remove', { messageId, emoji });
  };

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
        <div key={message.id} className="flex gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">
                {message.author.firstName || message.author.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
              {message.edited && <span className="text-xs text-gray-400">(edited)</span>}
            </div>
            <div className="text-sm mt-1">{renderMentionedText(message.content)}</div>
            {message.attachments && Array.isArray((message.attachments as any)) && (message.attachments as any).length > 0 && (
              <div className="mt-2 space-y-1">
                {((message.attachments as any) as Array<{url: string, name: string}>).map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📎 {file.name}
                  </a>
                ))}
              </div>
            )}
            <MessageReactions
              messageId={message.id}
              reactions={message.reactions || []}
              onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
              onRemoveReaction={(emoji) => handleRemoveReaction(message.id, emoji)}
            />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
