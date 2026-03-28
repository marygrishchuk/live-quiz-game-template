import { WebSocket } from 'ws';
import type { Game } from './types.js';
import { usersByIndex } from './stores.js';

export const sendJson = (ws: WebSocket, type: string, data: unknown): void => {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type, data, id: 0 }));
};

export const sendError = (ws: WebSocket, message: string): void => {
  sendJson(ws, 'error', { message });
};

export const broadcastToGame = (game: Game, type: string, data: unknown): void => {
  const seen = new Set<WebSocket>();
  const emit = (socket?: WebSocket) => {
    if (!socket || seen.has(socket)) return;
    seen.add(socket);
    sendJson(socket, type, data);
  };
  emit(usersByIndex[game.hostId]?.ws);
  game.players.forEach((player) => emit(player.ws));
};
