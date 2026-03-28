import type { Game } from './types.js';
import { broadcastToGame } from './outgoing.js';
import { broadcastQuestion } from './questionBroadcast.js';
import {
  buildResultsWithRoundScores,
  buildFinalScoreboard,
} from './utils/scoring.js';

export const clearQuestionTimer = (game: Game): void => {
  const timerHandle = game.questionTimer;
  timerHandle === undefined
    ? undefined
    : (clearTimeout(timerHandle), void (game.questionTimer = undefined));
};

export const resetRoundAnswerState = (game: Game): void => {
  game.playerAnswers = {};
  game.players.forEach((player) => {
    delete player.hasAnswered;
    delete player.answerTime;
    delete player.answeredCorrectly;
  });
};

const finishAfterLastRound = (game: Game): void => {
  game.status = 'finished';
  broadcastToGame(game, 'game_finished', {
    scoreboard: buildFinalScoreboard(game.players),
  });
};

export const scheduleQuestionTimer = (game: Game): void => {
  const questionIndex = game.currentQuestion;
  const question = game.questions[questionIndex];
  const delayMs = Math.max(0, Math.ceil(question.timeLimitSec * 1000));
  clearQuestionTimer(game);
  game.questionTimer = setTimeout(() => {
    game.questionTimer = undefined;
    finalizeQuestionRound(game, questionIndex);
  }, delayMs);
};

const advanceAfterRound = (game: Game, expectedIndex: number): void => {
  game.currentQuestion = expectedIndex + 1;
  resetRoundAnswerState(game);
  game.questionStartTime = Date.now();
  broadcastQuestion(game);
  scheduleQuestionTimer(game);
};

export const finalizeQuestionRound = (game: Game, expectedIndex: number): void => {
  if (game.status !== 'in_progress' || game.currentQuestion !== expectedIndex) return;
  clearQuestionTimer(game);
  const question = game.questions[expectedIndex];
  const start = game.questionStartTime ?? Date.now();
  const playerResults = buildResultsWithRoundScores(game, question, start);
  broadcastToGame(game, 'question_result', {
    questionIndex: expectedIndex,
    correctIndex: question.correctIndex,
    playerResults,
  });
  const hasMore = expectedIndex < game.questions.length - 1;
  hasMore ? advanceAfterRound(game, expectedIndex) : finishAfterLastRound(game);
};
