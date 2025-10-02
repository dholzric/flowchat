import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadChannels();
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data.workspaces);
      if (response.data.workspaces.length > 0) {
        setSelectedWorkspace(response.data.workspaces[0]);
      }
    } catch (error) {
      console.error('Load workspaces error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await api.get(`/channels/workspace/${selectedWorkspace.id}`);
      setChannels(response.data.channels);
    } catch (error) {
      console.error('Load channels error:', error);
    }
  };

  const handleChannelPress = (channel: any) => {
    navigation.navigate('Channel', { channel });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {selectedWorkspace?.name || 'FlowChat'}
        </Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Workspace Selector */}
      {workspaces.length > 1 && (
        <View style={styles.workspaceSelector}>
          <FlatList
            horizontal
            data={workspaces}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.workspaceChip,
                  selectedWorkspace?.id === item.id && styles.workspaceChipActive,
                ]}
                onPress={() => setSelectedWorkspace(item)}
              >
                <Text
                  style={[
                    styles.workspaceChipText,
                    selectedWorkspace?.id === item.id && styles.workspaceChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Channels List */}
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelItem}
            onPress={() => handleChannelPress(item)}
          >
            <View style={styles.channelIcon}>
              <Text style={styles.channelHash}>#</Text>
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.channelDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No channels yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 14,
  },
  workspaceSelector: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  workspaceChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  workspaceChipActive: {
    backgroundColor: '#007AFF',
  },
  workspaceChipText: {
    color: '#666',
    fontSize: 14,
  },
  workspaceChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  channelIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelHash: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
