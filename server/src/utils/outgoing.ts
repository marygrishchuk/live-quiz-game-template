import { WebSocket } from 'ws';
import type { Game } from '../types.js';
import { usersByIndex } from '../stores.js';
import { buildFinalScoreboard } from './scoring.js';

export const buildQuestionPayload = (game: Game) => {
  const question = game.questions[game.currentQuestion];
  return {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: question.text,
    options: question.options,
    timeLimitSec: question.timeLimitSec,
  };
};

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

export const broadcastQuestion = (game: Game): void => {
  broadcastToGame(game, 'question', buildQuestionPayload(game));
};

export const broadcastRankedGameFinished = (game: Game): void => {
  game.status = 'finished';
  broadcastToGame(game, 'game_finished', {
    scoreboard: buildFinalScoreboard(game.players),
  });
};
