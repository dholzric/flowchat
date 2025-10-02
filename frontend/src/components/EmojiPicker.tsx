import { useState } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉',
  '🔥', '⭐', '✅', '❌', '👀', '🙏', '💯', '👏',
  '🚀', '💪', '🤔', '😊', '😎', '🤗', '😍', '🥳',
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 w-64">
        <div className="grid grid-cols-8 gap-2">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
