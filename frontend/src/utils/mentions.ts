export function parseMentions(content: string): React.ReactNode[] {
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add mention
    parts.push({
      type: 'mention',
      username: match[1],
      text: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function renderMentionedText(content: string): JSX.Element {
  const parts = parseMentions(content);

  return (
    <>
      {parts.map((part, idx) => {
        if (typeof part === 'string') {
          return <span key={idx}>{part}</span>;
        }
        return (
          <span
            key={idx}
            className="bg-blue-100 text-blue-800 px-1 rounded font-medium"
          >
            {(part as any).text}
          </span>
        );
      })}
    </>
  );
}
