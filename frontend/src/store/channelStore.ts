import { create } from 'zustand';

interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  workspaceId: string;
}

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  addChannel: (channel: Channel) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  currentChannel: null,
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),
}));
