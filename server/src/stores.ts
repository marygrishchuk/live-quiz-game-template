import type { WebSocket } from 'ws';
import type { Game, User } from './types.js';

export const usersByIndex: Record<string, User> = {};
export const usersByName: Record<string, User> = {};
export const gamesById: Record<string, Game> = {};
export const codeToGameId: Record<string, string> = {};

const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_CODE_LENGTH = 6;

export const formatRoomCode = (code: string): string => code.trim().toUpperCase();

export const generateRoomCode = (): string => {
  while (true) {
    const candidateCode = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
    ).join('');
    if (!Object.hasOwn(codeToGameId, candidateCode)) return candidateCode;
  }
};

export const linkRoomCodeToGameId = (rawCode: string, gameId: string): void => {
  codeToGameId[formatRoomCode(rawCode)] = gameId;
};

export const unlinkRoomCodeFromGameId = (rawCode: string): void => {
  delete codeToGameId[formatRoomCode(rawCode)];
};

export const getGameIdByRoomCode = (rawCode: string): string | undefined => {
  const key = formatRoomCode(rawCode);
  return Object.hasOwn(codeToGameId, key) ? codeToGameId[key] : undefined;
};

export const getUserByWebSocket = (ws: WebSocket): User | undefined =>
  Object.values(usersByIndex).find((user) => user.ws === ws);
