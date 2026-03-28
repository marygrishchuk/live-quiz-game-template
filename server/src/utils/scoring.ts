import type { Player } from '../types.js';

export const scoreForCorrectAnswer = (
  questionStartTime: number,
  answerTime: number,
  timeLimitSec: number,
): number => {
  const timeLimitMs = timeLimitSec * 1000;
  const elapsedMs = answerTime - questionStartTime;
  const timeRemainingMs = Math.max(0, timeLimitMs - elapsedMs);
  return Math.round(1000 * (timeRemainingMs / timeLimitMs));
};

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
