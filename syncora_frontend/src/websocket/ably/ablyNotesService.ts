import { ablyClientInstance, getAblyClient } from './ablyClient';

type NoteEventAction = 'created' | 'updated' | 'deleted';

export type NoteChangeEvent = {
  action: NoteEventAction;
  note: {
    id: string;
    title?: string;
    updatedAt?: string | number;
    createdAt?: string | number;
    ownerEmail?: string;
  };
  at: number;
};

const channelNameForUser = (email: string) => `notes:${encodeURIComponent(email)}`;

let enabled = false;

export async function initNotesRealtime(): Promise<boolean> {
  try {
    const hasKey = !!import.meta.env.VITE_ABLY_API_KEY;
    if (!hasKey) return false;
    if (!ablyClientInstance.isClientConnected()) {
      await ablyClientInstance.connect();
    }
    enabled = ablyClientInstance.isClientConnected();
    return enabled;
  } catch {
    enabled = false;
    return false;
  }
}

export function isNotesRealtimeEnabled(): boolean {
  return enabled;
}

export function subscribeToNotesChanges(userEmail: string, handler: (evt: NoteChangeEvent) => void): () => void {
  if (!enabled) return () => {};
  const client = getAblyClient();
  if (!client) return () => {};

  const channelName = channelNameForUser(userEmail);
  const channel = client.channels.get(channelName);
  const listener = (msg: any) => {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      handler(data as NoteChangeEvent);
    } catch {
      // ignore malformed
    }
  };
  channel.subscribe('note-changed', listener);

  return () => {
    try {
      channel.unsubscribe('note-changed', listener);
    } catch {}
  };
}

export async function publishNoteChange(userEmail: string, event: NoteChangeEvent): Promise<void> {
  if (!enabled) return;
  const client = getAblyClient();
  if (!client) return;
  const channel = client.channels.get(channelNameForUser(userEmail));
  await channel.publish('note-changed', event);
}
