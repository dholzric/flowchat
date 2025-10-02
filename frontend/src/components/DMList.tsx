import { useState } from 'react';
import { useDMStore } from '../store/dmStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { DMListSkeleton } from './Skeleton';

interface NewDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDM: (userId: string) => void;
}

function NewDMModal({ isOpen, onClose, onCreateDM }: NewDMModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Start a Conversation</h2>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          placeholder="Search for a user..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        />

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loading && (
            <p className="text-gray-500 text-sm text-center py-4">Searching...</p>
          )}
          {!loading && users.length === 0 && searchQuery.trim() && (
            <p className="text-gray-500 text-sm text-center py-4">No users found</p>
          )}
          {!loading && users.length === 0 && !searchQuery.trim() && (
            <p className="text-gray-500 text-sm text-center py-4">
              Search for users to start a conversation
            </p>
          )}
          {!loading && users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onCreateDM(user.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
              <div className="text-left">
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-500">
                  {user.firstName} {user.lastName}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DMList() {
  const { conversations, currentConversation, setCurrentConversation, addConversation } = useDMStore();
  const { user } = useAuthStore();
  const [showNewDM, setShowNewDM] = useState(false);

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['dm-conversations'],
    queryFn: async () => {
      const res = await api.get('/dm');
      return res.data.conversations;
    },
  });

  const handleCreateDM = async (userId: string) => {
    try {
      const res = await api.post('/dm', {
        participantIds: [userId],
        isGroup: false,
      });
      addConversation(res.data.conversation);
      setCurrentConversation(res.data.conversation);
    } catch (error) {
      console.error('Failed to create DM:', error);
    }
  };

  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name;
    const otherParticipant = conversation.participants.find(
      (p: any) => p.userId !== user?.id
    );
    return otherParticipant?.user.username || 'Unknown User';
  };

  const getLastMessage = (conversation: any) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMsg = conversation.messages[0];
    return lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '');
  };

  return (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400">DIRECT MESSAGES</h3>
          <button
            onClick={() => setShowNewDM(true)}
            className="text-gray-400 hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-4">
        {isLoading ? (
          <DMListSkeleton />
        ) : (
          conversationsData?.map((conversation: any) => {
          const isActive = currentConversation?.id === conversation.id;
          const unreadCount = conversation.unreadCount || 0;
          return (
            <button
              key={conversation.id}
              onClick={() => setCurrentConversation(conversation)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-800 ${
                isActive ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate flex items-center justify-between ${unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                    <span>{getConversationName(conversation)}</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {getLastMessage(conversation)}
                  </div>
                </div>
              </div>
            </button>
          );
        })
        )}

        {!isLoading && (!conversationsData || conversationsData.length === 0) && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No conversations yet
          </div>
        )}
      </div>

      <NewDMModal
        isOpen={showNewDM}
        onClose={() => setShowNewDM(false)}
        onCreateDM={handleCreateDM}
      />
    </>
  );
}
