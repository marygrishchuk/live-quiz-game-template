import type { Game, User } from './types.js';

export const usersByIndex: Record<string, User> = {};
export const gamesById: Record<string, Game> = {};
export const codeToGameId: Record<string, string> = {};

const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_CODE_LENGTH = 6;

export function formatRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

export function generateRoomCode(): string {
  for (;;) {
    let out = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      out += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!Object.hasOwn(codeToGameId, out)) return out;
  }
}

export function linkRoomCodeToGameId(rawCode: string, gameId: string): void {
  codeToGameId[formatRoomCode(rawCode)] = gameId;
}

export function unlinkRoomCodeFromGameId(rawCode: string): void {
  delete codeToGameId[formatRoomCode(rawCode)];
}

export function getGameIdByRoomCode(rawCode: string): string | undefined {
  const key = formatRoomCode(rawCode);
  return Object.hasOwn(codeToGameId, key) ? codeToGameId[key] : undefined;
}
