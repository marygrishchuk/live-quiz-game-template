import type { RawData, WebSocket } from 'ws';
import type { WSMessage } from '../types.js';
import { handleAnswer } from '../game/answer.js';
import { handleCreateGame } from '../game/createGame.js';
import { handleJoinGame } from '../game/joinGame.js';
import { handleReg } from '../game/reg.js';
import { handleStartGame } from '../game/startGame.js';

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
    const envelope = value as Record<string, unknown>;
    if (typeof envelope.type !== 'string' || envelope.id !== 0) return null;
    return { type: envelope.type, data: envelope.data, id: 0 };
  } catch {
    return null;
  }
};

export const handleIncoming = (ws: WebSocket, raw: RawData): void => {
  try {
    const msg = parseMessage(raw);
    if (!msg) return;
    switch (msg.type) {
      case 'reg':
        handleReg(ws, msg.data);
        break;
      case 'create_game':
        handleCreateGame(ws, msg.data);
        break;
      case 'join_game':
        handleJoinGame(ws, msg.data);
        break;
      case 'start_game':
        handleStartGame(ws, msg.data);
        break;
      case 'answer':
        handleAnswer(ws, msg.data);
        break;
      default:
        break;
    }
  } catch {
  }
};
