import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import EmojiPicker from './EmojiPicker';

interface Reaction {
  id: string;
  emoji: string;
  user: {
    id: string;
    username: string;
  };
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

export default function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const { user } = useAuthStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReactionClick = (emoji: string) => {
    const userReaction = groupedReactions[emoji]?.find(r => r.user.id === user?.id);
    if (userReaction) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some(r => r.user.id === user?.id);
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors ${
              hasUserReacted
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
            }`}
            title={reactionList.map(r => r.user.username).join(', ')}
          >
            <span>{emoji}</span>
            <span className="text-xs">{reactionList.length}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="px-2 py-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="text-lg">😊</span>
        </button>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={onAddReaction}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
