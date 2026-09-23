import { dbService } from './sqlite';

export interface CloudSyncStatus {
  isEnabled: boolean;
  cloudEndpoint: string;
  lastSyncedAt: string | null;
  status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  deviceId: string;
}

const SYNC_CONFIG_KEY = 'workshop_cloud_sync_config';

function getDeviceId(): string {
  let id = localStorage.getItem('workshop_device_id');
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('workshop_device_id', id);
  }
  return id;
}

export const cloudSyncService = {
  getStatus(): CloudSyncStatus {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {}
    }
    return {
      isEnabled: false,
      cloudEndpoint: '',
      lastSyncedAt: null,
      status: 'IDLE',
      deviceId: getDeviceId(),
    };
  },

  saveConfig(endpoint: string, isEnabled: boolean): void {
    const current = this.getStatus();
    const updated: CloudSyncStatus = {
      ...current,
      cloudEndpoint: endpoint.trim(),
      isEnabled,
      status: 'IDLE',
    };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(updated));
  },

  async exportSnapshot(): Promise<Uint8Array | null> {
    return await dbService.exportDatabase();
  },

  async importSnapshot(bytes: Uint8Array): Promise<boolean> {
    try {
      await dbService.importDatabase(bytes);
      return true;
    } catch (err) {
      console.error('Import database failed:', err);
      return false;
    }
  },

  async syncWithRemote(): Promise<boolean> {
    const cfg = this.getStatus();
    if (!cfg.isEnabled || !cfg.cloudEndpoint) return false;

    cfg.status = 'SYNCING';
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));

    try {
      const bytes = await dbService.exportDatabase();
      if (!bytes) throw new Error('Could not export database bytes');

      // Convert Uint8Array to Base64
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      const res = await fetch(cfg.cloudEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': cfg.deviceId,
        },
        body: JSON.stringify({
          deviceId: cfg.deviceId,
          timestamp: new Date().toISOString(),
          data: base64Data,
        }),
      });

      if (!res.ok) {
        throw new Error(`Sync HTTP error ${res.status}`);
      }

      cfg.status = 'SUCCESS';
      cfg.lastSyncedAt = new Date().toISOString();
      cfg.errorMessage = undefined;
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
      return true;
    } catch (err: any) {
      cfg.status = 'ERROR';
      cfg.errorMessage = err.message || 'Sync failed';
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
      return false;
    }
  },
};
