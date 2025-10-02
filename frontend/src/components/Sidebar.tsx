import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useChannelStore } from '../store/channelStore';
import { useDMStore } from '../store/dmStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import DMList from './DMList';

export default function Sidebar() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { channels, setChannels, setCurrentChannel } = useChannelStore();
  const { setCurrentConversation } = useDMStore();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data.workspaces;
    },
  });

  const { data: channelsData } = useQuery({
    queryKey: ['channels', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace) return [];
      const res = await api.get(`/channels/workspace/${currentWorkspace.id}`);
      return res.data.channels;
    },
    enabled: !!currentWorkspace,
  });

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !newChannelName.trim()) return;

    try {
      const res = await api.post(`/channels/workspace/${currentWorkspace.id}`, {
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: '',
        isPrivate: false,
      });

      setChannels([...channels, res.data.channel]);
      setNewChannelName('');
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Workspace selector */}
      <div className="p-4 border-b border-gray-700">
        <select
          className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
          value={currentWorkspace?.id || ''}
          onChange={(e) => {
            const workspace = workspacesData?.find((w: any) => w.id === e.target.value);
            setCurrentWorkspace(workspace || null);
          }}
        >
          <option value="">Select workspace</option>
          {workspacesData?.map((workspace: any) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Channels</h3>
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>

          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} className="mb-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="w-full bg-gray-800 rounded px-2 py-1 text-sm"
                autoFocus
              />
            </form>
          )}

          <div className="space-y-1">
            {channelsData?.map((channel: any) => {
              const unreadCount = 0; // TODO: Calculate unread count
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    setCurrentChannel(channel);
                    setCurrentConversation(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-gray-800 text-sm flex items-center justify-between group"
                >
                  <span># {channel.name}</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DMList />
      </div>

      {/* User info */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-sm">
          <div className="font-semibold">User</div>
          <div className="text-xs text-gray-400">Online</div>
        </div>
      </div>
    </aside>
  );
}
