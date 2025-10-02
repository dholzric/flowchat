import { useState } from 'react';
import { useChannelStore } from '../store/channelStore';
import { socketService } from '../services/socket';

export default function MessageInput() {
  const { currentChannel } = useChannelStore();
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel) return;

    socketService.emit('message:send', {
      channelId: currentChannel.id,
      content: message.trim(),
    });

    setMessage('');
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message #${currentChannel.name}`}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>
    </div>
  );
}
