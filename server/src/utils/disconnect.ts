import type { WebSocket } from 'ws';
import type { Game } from '../types.js';
import {
  broadcastRankedGameFinished,
  broadcastToGame,
  buildPlayersPayload,
} from './outgoing.js';
import { clearQuestionTimer, finalizeQuestionRound } from '../game/questionRound.js';
import {
  gamesById,
  getUserByWebSocket,
  unlinkRoomCodeFromGameId,
} from '../stores.js';

const findHostedGame = (hostUserId: string) =>
  Object.values(gamesById).find((game) => game.hostId === hostUserId);

const findGameContainingPlayer = (playerUserId: string) =>
  Object.values(gamesById).find((game) =>
    game.players.some((player) => player.index === playerUserId),
  );

const removeGameFromStores = (game: Game): void => {
  unlinkRoomCodeFromGameId(game.code);
  delete gamesById[game.id];
};

const tryFinalizeIfAllAnswered = (game: Game): void => {
  game.status !== 'in_progress' || game.players.length < 1
    ? undefined
    : game.players.every((player) =>
          Object.hasOwn(game.playerAnswers, player.index),
        )
      ? finalizeQuestionRound(game, game.currentQuestion)
      : undefined;
};

export const handleSocketClosed = (closedSocket: WebSocket): void => {
  const user = getUserByWebSocket(closedSocket);
  if (user === undefined) return;

  const hostedGame = findHostedGame(user.index);
  if (hostedGame !== undefined) {
    clearQuestionTimer(hostedGame);
    broadcastRankedGameFinished(hostedGame);
    removeGameFromStores(hostedGame);
    delete user.ws;
    return;
  }

  const playerGame = findGameContainingPlayer(user.index);
  if (playerGame !== undefined) {
    playerGame.players = playerGame.players.filter(
      (player) => player.index !== user.index,
    );
    delete playerGame.playerAnswers[user.index];
    broadcastToGame(
      playerGame,
      'update_players',
      buildPlayersPayload(playerGame),
    );
    tryFinalizeIfAllAnswered(playerGame);
  }

  delete user.ws;
};
