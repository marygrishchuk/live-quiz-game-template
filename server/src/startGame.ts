import type { WebSocket } from 'ws';
import { broadcastQuestion, sendError } from './utils/outgoing.js';
import {
  clearQuestionTimer,
  resetRoundAnswerState,
  scheduleQuestionTimer,
} from './questionRound.js';
import { gamesById, getUserByWebSocket } from './stores.js';

const readStartGameId = (data: unknown): string | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const gameId = (data as Record<string, unknown>).gameId;
  return typeof gameId === 'string' && gameId.trim() ? gameId.trim() : null;
};

export const handleStartGame = (ws: WebSocket, data: unknown): void => {
  const user = getUserByWebSocket(ws);
  if (user === undefined) {
    sendError(ws, 'Register before starting a game');
    return;
  }
  const gameId = readStartGameId(data);
  if (gameId === null) {
    sendError(ws, 'Invalid game');
    return;
  }
  const game = gamesById[gameId];
  if (game === undefined) {
    sendError(ws, 'Game not found');
    return;
  }
  if (user.index !== game.hostId) {
    sendError(ws, 'Only the host can start the game');
    return;
  }
  if (game.status !== 'waiting') {
    sendError(ws, 'Game cannot be started');
    return;
  }
  if (game.players.length < 1) {
    sendError(ws, 'Need at least one player');
    return;
  }
  clearQuestionTimer(game);
  game.status = 'in_progress';
  game.currentQuestion = 0;
  resetRoundAnswerState(game);
  game.questionStartTime = Date.now();
  broadcastQuestion(game);
  scheduleQuestionTimer(game);
};
