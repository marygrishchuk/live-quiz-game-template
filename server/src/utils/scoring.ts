import type { Game, Player, Question } from '../types.js';

export const scoreForCorrectAnswer = (
  questionStartTime: number,
  answerTime: number,
  timeLimitSec: number,
): number => {
  const timeLimitMs = timeLimitSec * 1000;
  const elapsedMs = answerTime - questionStartTime;
  const timeRemainingMs = Math.max(0, timeLimitMs - elapsedMs);
  return Math.min(1000, Math.round(1000 * (timeRemainingMs / timeLimitMs)));
};

export const buildResultsWithRoundScores = (
  game: Game,
  question: Question,
  questionStartTime: number,
) =>
  game.players.map((player) => {
    const answerRecord = game.playerAnswers[player.index];
    const answered = answerRecord !== undefined;
    const isCorrect = answered ? answerRecord.answerIndex === question.correctIndex : false;
    const pointsEarned = isCorrect
      ? scoreForCorrectAnswer(
        questionStartTime,
        answerRecord.timestamp,
        question.timeLimitSec,
      )
      : 0;
    player.score += pointsEarned;
    return {
      name: player.name,
      answered,
      correct: answered && isCorrect,
      pointsEarned,
      totalScore: player.score,
    };
  });

export const buildFinalScoreboard = (players: Player[]) =>
  [...players]
    .sort(
      (left, right) =>
        right.score - left.score || left.name.localeCompare(right.name),
    )
    .map((player, position) => ({
      name: player.name,
      score: player.score,
      rank: position + 1,
    }));
