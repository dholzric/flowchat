import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { renderMentionedText } from '../utils/mentions';
import MessageReactions from './MessageReactions';
import { MessageSkeleton } from './Skeleton';

interface ThreadPanelProps {
  messageId: string;
  onClose: () => void;
}

export default function ThreadPanel({ messageId, onClose }: ThreadPanelProps) {
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: parentMessageData, isLoading: isLoadingParent } = useQuery({
    queryKey: ['message', messageId],
    queryFn: async () => {
      const res = await api.get(`/messages/${messageId}/replies`);
      return res.data;
    },
  });

  const { data: repliesData, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['thread-replies', messageId],
    queryFn: async () => {
      const res = await api.get(`/messages/${messageId}/replies`);
      return res.data.replies;
    },
  });

  useEffect(() => {
    if (repliesData) {
      setReplies(repliesData);
    }
  }, [repliesData]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (message.parentId === messageId) {
        setReplies((prev) => [...prev, message]);
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [messageId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    socketService.emit('message:send', {
      channelId: parentMessageData?.replies?.[0]?.channelId,
      content: replyContent.trim(),
      parentId: messageId,
    });

    setReplyContent('');
  };

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Thread</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {/* Parent Message */}
      {isLoadingParent ? (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <MessageSkeleton />
        </div>
      ) : (
        parentMessageData && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {parentMessageData.author?.firstName || parentMessageData.author?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(parentMessageData.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm mt-1">{renderMentionedText(parentMessageData.content)}</div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingReplies ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        ) : replies.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No replies yet. Start the conversation!
          </p>
        ) : (
          replies.map((reply: any) => (
          <div key={reply.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm">
                  {reply.author.firstName || reply.author.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(reply.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm mt-1">{renderMentionedText(reply.content)}</div>
              {reply.reactions && reply.reactions.length > 0 && (
                <MessageReactions
                  messageId={reply.id}
                  reactions={reply.reactions}
                  onAddReaction={(emoji) => socketService.emit('reaction:add', { messageId: reply.id, emoji })}
                  onRemoveReaction={(emoji) => socketService.emit('reaction:remove', { messageId: reply.id, emoji })}
                />
              )}
            </div>
          </div>
        ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Reply..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </form>
      </div>
    </div>
  );
}
