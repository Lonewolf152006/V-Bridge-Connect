// VBridgeConnect — Supabase Realtime Client & Strict Channel Budget Manager
// Architecture: Strict Channel Budgeting for 200-User Capacity (FR-070 to FR-075)
//
// Channel Budget Guarantee:
// - Max 1 User Channel per client: `user:${userId}` (Personal notifications, milestone status)
// - Max 1 Workspace Channel per client: `workspace:${teamId}` (Discussions, repository changes)
// - Total per client: EXACTLY 2 CHANNELS MAXIMUM
// - Peak concurrent load (200 active users): 200 * 2 = 400 concurrent channels
// - Fits safely within Supabase Pro Realtime concurrent connection ceiling (500 connections)

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nionpjxfbrafuhdpxrmi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return browserClient;
}

// Track active channels in this browser tab
const activeChannels: {
  userChannel: RealtimeChannel | null;
  workspaceChannel: RealtimeChannel | null;
} = {
  userChannel: null,
  workspaceChannel: null,
};

/**
 * Subscribes to the single user notification channel.
 * Automatically cleans up any previously open user channel.
 */
export function subscribeUserNotifications(
  userId: string,
  onNotification: (payload: any) => void
): () => void {
  const client = getSupabaseBrowserClient();

  if (activeChannels.userChannel) {
    client.removeChannel(activeChannels.userChannel);
    activeChannels.userChannel = null;
  }

  const channelName = `user:${userId}`;
  const channel = client.channel(channelName);

  channel
    .on('broadcast', { event: 'notification' }, (payload) => onNotification(payload))
    .subscribe();

  activeChannels.userChannel = channel;

  return () => {
    if (activeChannels.userChannel === channel) {
      client.removeChannel(channel);
      activeChannels.userChannel = null;
    }
  };
}

/**
 * Subscribes to the single active team workspace channel.
 * Automatically tears down previous workspace channel to maintain 2-channel budget limit.
 */
export function subscribeWorkspaceChannel(
  teamId: string,
  onEvent: (event: string, payload: any) => void
): () => void {
  const client = getSupabaseBrowserClient();

  if (activeChannels.workspaceChannel) {
    client.removeChannel(activeChannels.workspaceChannel);
    activeChannels.workspaceChannel = null;
  }

  const channelName = `workspace:${teamId}`;
  const channel = client.channel(channelName);

  channel
    .on('broadcast', { event: 'message' }, (payload) => onEvent('message', payload))
    .on('broadcast', { event: 'milestone' }, (payload) => onEvent('milestone', payload))
    .subscribe();

  activeChannels.workspaceChannel = channel;

  return () => {
    if (activeChannels.workspaceChannel === channel) {
      client.removeChannel(channel);
      activeChannels.workspaceChannel = null;
    }
  };
}

/**
 * Returns current client channel stats and 200-user scale projection.
 */
export function getRealtimeChannelMetrics() {
  const activeCount = (activeChannels.userChannel ? 1 : 0) + (activeChannels.workspaceChannel ? 1 : 0);
  const maxPerClient = 2;
  const targetUserScale = 200;
  const projectedPeakChannels = targetUserScale * maxPerClient; // 400
  const supabaseLimit = 500; // Supabase default pro connection ceiling

  return {
    currentTabChannels: activeCount,
    maxChannelsPerClient: maxPerClient,
    targetUserScale,
    projectedPeakChannels,
    supabaseLimit,
    isWithinBudget: projectedPeakChannels <= supabaseLimit,
    activeUserChannel: !!activeChannels.userChannel,
    activeWorkspaceChannel: !!activeChannels.workspaceChannel,
  };
}
