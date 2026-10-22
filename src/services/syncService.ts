import { TournamentState } from '../types/tournament';

const STORAGE_KEY_PREFIX = 'equiplay_remote_tournament_';
const BROADCAST_CHANNEL_PREFIX = 'equiplay_tournament_channel_';
const CLOUD_CONFIG_KEY = 'equiplay_cloud_sync_config';

export interface CloudSyncConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  customEndpoint?: string;
}

export interface SyncService {
  syncTournamentState(tournamentId: string, fullState: TournamentState): Promise<void>;
  subscribeToTournament(
    tournamentId: string,
    onUpdate: (state: TournamentState) => void
  ): () => void;
  getLatestState(tournamentId: string): Promise<TournamentState | null>;
  getCloudConfig(): CloudSyncConfig;
  setCloudConfig(config: CloudSyncConfig): void;
  isCloudConfigured(): boolean;
}

class LightweightSyncService implements SyncService {
  private channels: Map<string, BroadcastChannel> = new Map();
  private listeners: Map<string, Set<(state: TournamentState) => void>> = new Map();
  private lastKnownTimestamp: Map<string, number> = new Map();

  getCloudConfig(): CloudSyncConfig {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(CLOUD_CONFIG_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Fallback
      }
    }
    // Also check Vite environment variables if available
    const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
    return {
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
      customEndpoint: env.VITE_CLOUD_SYNC_URL,
    };
  }

  setCloudConfig(config: CloudSyncConfig): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
      } catch (err) {
        console.warn('Failed to save cloud sync config:', err);
      }
    }
  }

  isCloudConfigured(): boolean {
    const config = this.getCloudConfig();
    return Boolean((config.supabaseUrl && config.supabaseAnonKey) || config.customEndpoint);
  }

  private getChannel(tournamentId: string): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
      return null;
    }
    if (!this.channels.has(tournamentId)) {
      const channel = new BroadcastChannel(`${BROADCAST_CHANNEL_PREFIX}${tournamentId}`);
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'TOURNAMENT_UPDATED') {
          const state = event.data.payload as TournamentState;
          this.notifySubscribers(tournamentId, state);
        }
      };
      this.channels.set(tournamentId, channel);
    }
    return this.channels.get(tournamentId) || null;
  }

  private notifySubscribers(tournamentId: string, state: TournamentState) {
    this.lastKnownTimestamp.set(tournamentId, state.updatedAt || Date.now());
    const subs = this.listeners.get(tournamentId);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(state);
        } catch (err) {
          console.error('Error invoking tournament subscriber callback:', err);
        }
      });
    }
  }

  async syncTournamentState(tournamentId: string, fullState: TournamentState): Promise<void> {
    const serialized = JSON.stringify(fullState);

    // 1. Persist to cross-window / tab shared localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${tournamentId}`, serialized);
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
    }

    // 2. Broadcast to all active tabs/windows (spectators & boards) on the same device in real-time
    const channel = this.getChannel(tournamentId);
    if (channel) {
      channel.postMessage({
        type: 'TOURNAMENT_UPDATED',
        tournamentId,
        payload: fullState,
        timestamp: Date.now(),
      });
    }

    // Also notify local listeners in current window
    this.notifySubscribers(tournamentId, fullState);

    // 3. Remote Cloud Sync (Supabase / REST Cloud Server)
    const cloudConfig = this.getCloudConfig();
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (!isOnline) {
      throw new Error('Network offline (cached locally)');
    }

    if (cloudConfig.supabaseUrl && cloudConfig.supabaseAnonKey) {
      const baseUrl = cloudConfig.supabaseUrl
        .replace(/\/rest\/v1\/?$/, '')
        .replace(/\/+$/, '');
      const endpoint = `${baseUrl}/rest/v1/tournaments?on_conflict=tournament_id`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: cloudConfig.supabaseAnonKey,
          Authorization: `Bearer ${cloudConfig.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          tournament_id: tournamentId,
          data: fullState,
          updated_at: new Date(fullState.updatedAt || Date.now()).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloud sync error: ${response.statusText}`);
      }
    } else if (cloudConfig.customEndpoint) {
      const response = await fetch(cloudConfig.customEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          state: fullState,
          updatedAt: fullState.updatedAt || Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Custom server sync error: ${response.statusText}`);
      }
    }
  }

  subscribeToTournament(
    tournamentId: string,
    onUpdate: (state: TournamentState) => void
  ): () => void {
    if (!this.listeners.has(tournamentId)) {
      this.listeners.set(tournamentId, new Set());
    }
    this.listeners.get(tournamentId)!.add(onUpdate);

    // Ensure BroadcastChannel is listening
    this.getChannel(tournamentId);

    // Storage event listener for cross-tab or cross-device PWA updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY_PREFIX}${tournamentId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as TournamentState;
          this.notifySubscribers(tournamentId, parsed);
        } catch (err) {
          console.error('Failed to parse updated tournament state:', err);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    // Immediately fetch latest state (cloud or local cache)
    this.getLatestState(tournamentId).then((latest) => {
      if (latest) {
        onUpdate(latest);
      }
    });

    // Cloud polling interval if remote cloud sync is configured
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (this.isCloudConfigured() && typeof window !== 'undefined') {
      pollInterval = setInterval(async () => {
        try {
          const remote = await this.fetchFromCloud(tournamentId);
          if (remote) {
            const currentTs = this.lastKnownTimestamp.get(tournamentId) || 0;
            if (remote.updatedAt && remote.updatedAt > currentTs) {
              this.notifySubscribers(tournamentId, remote);
            }
          }
        } catch {
          // Ignore transient polling errors
        }
      }, 4000);
    }

    return () => {
      const subs = this.listeners.get(tournamentId);
      if (subs) {
        subs.delete(onUpdate);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }

  async getLatestState(tournamentId: string): Promise<TournamentState | null> {
    // 1. Try remote cloud first if configured and online
    if (this.isCloudConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        const cloudState = await this.fetchFromCloud(tournamentId);
        if (cloudState) {
          // Cache locally
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(
              `${STORAGE_KEY_PREFIX}${tournamentId}`,
              JSON.stringify(cloudState)
            );
          }
          return cloudState;
        }
      } catch {
        // Fall back to local storage
      }
    }

    // 2. Fall back to local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tournamentId}`);
      if (raw) {
        try {
          return JSON.parse(raw) as TournamentState;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private async fetchFromCloud(tournamentId: string): Promise<TournamentState | null> {
    const cloudConfig = this.getCloudConfig();
    if (cloudConfig.supabaseUrl && cloudConfig.supabaseAnonKey) {
      const baseUrl = cloudConfig.supabaseUrl
        .replace(/\/rest\/v1\/?$/, '')
        .replace(/\/+$/, '');
      const url = `${baseUrl}/rest/v1/tournaments?tournament_id=eq.${encodeURIComponent(
        tournamentId
      )}&select=data,updated_at&order=updated_at.desc&limit=1`;

      const res = await fetch(url, {
        headers: {
          apikey: cloudConfig.supabaseAnonKey,
          Authorization: `Bearer ${cloudConfig.supabaseAnonKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].data) {
          return data[0].data as TournamentState;
        }
      }
    } else if (cloudConfig.customEndpoint) {
      const res = await fetch(
        `${cloudConfig.customEndpoint}?tournamentId=${encodeURIComponent(tournamentId)}`
      );
      if (res.ok) {
        const json = await res.json();
        return (json.state || json) as TournamentState;
      }
    }
    return null;
  }
}

export const syncService: SyncService = new LightweightSyncService();
