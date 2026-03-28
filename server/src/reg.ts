import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import type { User } from './types.js';
import { sendJson } from './outgoing.js';
import { usersByIndex, usersByName } from './stores.js';

const readRegPayload = (data: unknown): { name: string; password: string } | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.name !== 'string' || typeof obj.password !== 'string') return null;
  const name = obj.name.trim();
  const password = obj.password.trim();
  if (!name || !password) return null;
  return { name, password };
};

export const handleReg = (ws: WebSocket, data: unknown): void => {
  const payload = readRegPayload(data);
  if (!payload) {
    sendJson(ws, 'reg', { name: '', index: '', error: true, errorText: 'Invalid credentials' });
    return;
  }
  const { name, password } = payload;
  const existing = usersByName[name];
  if (existing) {
    if (existing.password !== password) {
      sendJson(ws, 'reg', { name, index: '', error: true, errorText: 'Wrong password' });
      return;
    }
    existing.ws = ws;
    sendJson(ws, 'reg', { name, index: existing.index, error: false, errorText: '' });
    return;
  }
  const index = randomUUID();
  const user: User = { name, password, index, ws };
  usersByIndex[index] = user;
  usersByName[name] = user;
  sendJson(ws, 'reg', { name, index, error: false, errorText: '' });
};
