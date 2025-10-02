import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface MessageActionsProps {
  messageId: string;
  authorId: string;
  content: string;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

export default function MessageActions({
  messageId,
  authorId,
  content,
  onEdit,
  onDelete,
  onReply,
}: MessageActionsProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnMessage = user?.id === authorId;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    onEdit(messageId, editContent.trim());
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this message?')) {
      onDelete(messageId);
      setShowMenu(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleEditSubmit} className="mt-1">
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          autoFocus
        />
        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditContent(content);
            }}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded shadow-sm">
        {onReply && (
          <button
            onClick={() => onReply(messageId)}
            className="p-1 hover:bg-gray-100 text-gray-600"
            title="Reply in thread"
          >
            💬
          </button>
        )}
        {isOwnMessage && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-gray-100 text-gray-600"
              title="Edit message"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-100 text-gray-600"
              title="Delete message"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}
