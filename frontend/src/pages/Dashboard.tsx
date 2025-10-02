import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChannelStore } from '../store/channelStore';
import { useDMStore } from '../store/dmStore';
import { socketService } from '../services/socket';
import { requestNotificationPermission, showNotification } from '../utils/notifications';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import DMView from '../components/DMView';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

export default function Dashboard() {
  const { user, logout, token } = useAuthStore();
  const { currentChannel } = useChannelStore();
  const { currentConversation } = useDMStore();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  useEffect(() => {
    if (token) {
      socketService.connect(token);
      requestNotificationPermission();
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Don't notify for own messages
      if (message.authorId === user?.id) return;

      // Don't notify if currently viewing the channel
      if (currentChannel?.id === message.channelId) return;

      showNotification({
        title: `#${message.channel?.name || 'New message'}`,
        body: `${message.author.username}: ${message.content}`,
        tag: message.channelId,
      });
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [user, currentChannel]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">FlowChat</h1>
          {currentChannel && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">|</span>
              <span className="font-semibold"># {currentChannel.name}</span>
            </div>
          )}
          {currentConversation && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">|</span>
              <span className="font-semibold">Direct Message</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateWorkspace(true)}
            className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
          >
            + New Workspace
          </button>
          <span className="text-sm text-gray-600">
            {user?.firstName || user?.username}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-white">
          {currentConversation ? (
            <DMView />
          ) : (
            <>
              <MessageList />
              <MessageInput />
            </>
          )}
        </main>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
      />
    </div>
  );
}
