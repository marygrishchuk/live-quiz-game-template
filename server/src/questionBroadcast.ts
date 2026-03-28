import type { Game } from './types.js';
import { broadcastToGame } from './outgoing.js';

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

export const broadcastQuestion = (game: Game): void => {
  broadcastToGame(game, 'question', buildQuestionPayload(game));
};
