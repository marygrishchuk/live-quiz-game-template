import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import type { Game, Question } from './types.js';
import { sendError, sendJson } from './outgoing.js';
import {
  gamesById,
  generateRoomCode,
  getUserByWebSocket,
  linkRoomCodeToGameId,
} from './stores.js';

const parseOneQuestion = (item: unknown): Question | null => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const rawQuestion = item as Record<string, unknown>;
  if (typeof rawQuestion.text !== 'string' || !rawQuestion.text.trim()) return null;
  if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length !== 4) return null;
  if (
    !rawQuestion.options.every(
      (option) => typeof option === 'string' && String(option).trim(),
    )
  ) {
    return null;
  }
  const { correctIndex, timeLimitSec } = rawQuestion;
  if (
    typeof correctIndex !== 'number' ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex > 3
  ) {
    return null;
  }
  if (typeof timeLimitSec !== 'number' || !Number.isFinite(timeLimitSec) || timeLimitSec <= 0) {
    return null;
  }
  return {
    text: rawQuestion.text.trim(),
    options: (rawQuestion.options as string[]).map((option) => option.trim()),
    correctIndex,
    timeLimitSec,
  };
};

const parseValidatedQuestions = (data: unknown): Question[] | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const raw = (data as Record<string, unknown>).questions;
  if (!Array.isArray(raw) || raw.length < 1) return null;
  const parsed = raw.map(parseOneQuestion);
  return parsed.every((question): question is Question => question !== null)
    ? parsed
    : null;
};

export const handleCreateGame = (ws: WebSocket, data: unknown): void => {
  const user = getUserByWebSocket(ws);
  if (!user) {
    sendError(ws, 'Register before creating a game');
    return;
  }
  const questions = parseValidatedQuestions(data);
  if (!questions) {
    sendError(ws, 'Invalid questions');
    return;
  }
  const id = randomUUID();
  const code = generateRoomCode();
  const game: Game = {
    id,
    code,
    hostId: user.index,
    questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: {},
  };
  gamesById[id] = game;
  linkRoomCodeToGameId(code, id);
  sendJson(ws, 'game_created', { gameId: id, code });
};
