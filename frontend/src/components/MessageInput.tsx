import { useState } from 'react';
import { useChannelStore } from '../store/channelStore';
import { socketService } from '../services/socket';
import FileUpload from './FileUpload';

export default function MessageInput() {
  const { currentChannel } = useChannelStore();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || !currentChannel) return;

    socketService.emit('message:send', {
      channelId: currentChannel.id,
      content: message.trim() || '📎 File attached',
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setMessage('');
    setAttachments([]);
  };

  const handleFileUpload = (url: string, fileName: string) => {
    setAttachments([...attachments, { url, name: fileName }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
            >
              <span>📎 {file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <FileUpload onUploadComplete={handleFileUpload} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message #${currentChannel.name}`}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Send
        </button>
      </form>
    </div>
  );
}
