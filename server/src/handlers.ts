import type { RawData, WebSocket } from 'ws';
import type { WSMessage } from './types.js';
import { handleReg } from './reg.js';

const rawToUtf8 = (raw: RawData): string => {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString('utf8');
  return Buffer.concat(raw).toString('utf8');
};

const parseMessage = (raw: RawData): WSMessage | null => {
  try {
    const value = JSON.parse(rawToUtf8(raw)) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const rec = value as Record<string, unknown>;
    if (typeof rec.type !== 'string' || rec.id !== 0) return null;
    return { type: rec.type, data: rec.data, id: 0 };
  } catch {
    return null;
  }
};

const onCreateGame = (_ws: WebSocket, _data: unknown): void => {};

const onJoinGame = (_ws: WebSocket, _data: unknown): void => {};

const onStartGame = (_ws: WebSocket, _data: unknown): void => {};

const onAnswer = (_ws: WebSocket, _data: unknown): void => {};

export const handleIncoming = (ws: WebSocket, raw: RawData): void => {
  try {
    const msg = parseMessage(raw);
    if (!msg) return;
    switch (msg.type) {
      case 'reg':
        handleReg(ws, msg.data);
        break;
      case 'create_game':
        onCreateGame(ws, msg.data);
        break;
      case 'join_game':
        onJoinGame(ws, msg.data);
        break;
      case 'start_game':
        onStartGame(ws, msg.data);
        break;
      case 'answer':
        onAnswer(ws, msg.data);
        break;
      default:
        break;
    }
  } catch {
  }
};
