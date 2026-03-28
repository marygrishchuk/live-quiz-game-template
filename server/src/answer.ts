import type { WebSocket } from 'ws';
import { sendError, sendJson } from './utils/outgoing.js';
import { finalizeQuestionRound } from './questionRound.js';
import { gamesById, getUserByWebSocket } from './stores.js';

const readAnswerPayload = (
  data: unknown,
): { gameId: string; questionIndex: number; answerIndex: number } | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const body = data as Record<string, unknown>;
  const gameId = body.gameId;
  const questionIndex = body.questionIndex;
  const answerIndex = body.answerIndex;
  return typeof gameId === 'string' &&
    gameId.trim() &&
    typeof questionIndex === 'number' &&
    Number.isInteger(questionIndex) &&
    typeof answerIndex === 'number' &&
    Number.isInteger(answerIndex)
    ? { gameId: gameId.trim(), questionIndex, answerIndex }
    : null;
};

export const handleAnswer = (ws: WebSocket, data: unknown): void => {
  const user = getUserByWebSocket(ws);
  if (user === undefined) {
    sendError(ws, 'Register before answering');
    return;
  }
  const payload = readAnswerPayload(data);
  if (payload === null) {
    sendError(ws, 'Invalid answer');
    return;
  }
  const game = gamesById[payload.gameId];
  if (game === undefined) {
    sendError(ws, 'Game not found');
    return;
  }
  if (game.status !== 'in_progress') {
    sendError(ws, 'Game is not in progress');
    return;
  }
  if (payload.questionIndex !== game.currentQuestion) {
    sendError(ws, 'Wrong question');
    return;
  }
  const player = game.players.find((entry) => entry.index === user.index);
  if (!player) {
    sendError(ws, 'You are not in this game');
    return;
  }
  if (payload.answerIndex < 0 || payload.answerIndex > 3) {
    sendError(ws, 'Invalid option');
    return;
  }
  if (Object.hasOwn(game.playerAnswers, player.index)) {
    sendJson(ws, 'answer_accepted', { questionIndex: payload.questionIndex });
    return;
  }
  const timestamp = Date.now();
  game.playerAnswers[player.index] = {
    answerIndex: payload.answerIndex,
    timestamp,
  };
  player.hasAnswered = true;
  sendJson(ws, 'answer_accepted', { questionIndex: payload.questionIndex });
  const allAnswered = game.players.every((entry) =>
    Object.hasOwn(game.playerAnswers, entry.index),
  );
  if (allAnswered) finalizeQuestionRound(game, game.currentQuestion);
};
