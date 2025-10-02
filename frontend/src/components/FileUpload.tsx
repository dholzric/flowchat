import { useState, useRef } from 'react';
import { api } from '../services/api';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploadComplete(res.data.file.url, res.data.file.originalName);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 relative"
        title={uploading ? 'Uploading...' : 'Attach file'}
      >
        {uploading ? (
          <span className="inline-block animate-spin">⏳</span>
        ) : (
          '📎'
        )}
      </button>
    </>
  );
}
