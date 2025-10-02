import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import api from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';

export default function ChannelScreen({ route, navigation }: any) {
  const { channel } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    navigation.setOptions({ title: `# ${channel.name}` });
    loadMessages();

    // Connect socket
    socketService.connect();

    // Join channel
    socketService.emit('channel:join', { channelId: channel.id });

    // Listen for new messages
    socketService.on('message:new', handleNewMessage);
    socketService.on('message:updated', handleMessageUpdated);
    socketService.on('message:deleted', handleMessageDeleted);

    return () => {
      socketService.emit('channel:leave', { channelId: channel.id });
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:updated', handleMessageUpdated);
      socketService.off('message:deleted', handleMessageDeleted);
    };
  }, [channel.id]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/channel/${channel.id}`);
      const formattedMessages = response.data.messages.reverse().map(formatMessage);
      setMessages(formattedMessages);

      // Mark as read
      await api.post(`/channels/${channel.id}/read`);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const formatMessage = (msg: any): IMessage => ({
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.createdAt),
    user: {
      _id: msg.author.id,
      name: msg.author.firstName || msg.author.username,
      avatar: msg.author.avatar,
    },
  });

  const handleNewMessage = (message: any) => {
    if (message.channelId === channel.id) {
      const formattedMessage = formatMessage(message);
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [formattedMessage])
      );
    }
  };

  const handleMessageUpdated = (message: any) => {
    if (message.channelId === channel.id) {
      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          msg._id === message.id ? formatMessage(message) : msg
        )
      );
    }
  };

  const handleMessageDeleted = (data: any) => {
    if (data.channelId === channel.id) {
      setMessages((previousMessages) =>
        previousMessages.filter((msg) => msg._id !== data.messageId)
      );
    }
  };

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    const message = newMessages[0];
    socketService.emit('message:send', {
      channelId: channel.id,
      content: message.text,
    });
  }, [channel.id]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user?.id || '',
          name: user?.firstName || user?.username || '',
          avatar: user?.avatar,
        }}
        renderUsernameOnMessage
        alwaysShowSend
        scrollToBottom
        scrollToBottomComponent={() => (
          <View style={styles.scrollToBottomButton}>
            <View style={styles.scrollToBottomIcon} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollToBottomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToBottomIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
});
