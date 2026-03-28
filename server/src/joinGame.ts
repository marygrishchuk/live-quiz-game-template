import type { WebSocket } from 'ws';
import type { Game, Player } from './types.js';
import { broadcastToGame, sendError, sendJson } from './utils/outgoing.js';
import { gamesById, getGameIdByRoomCode, getUserByWebSocket } from './stores.js';

const readJoinCode = (data: unknown): string | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const code = (data as Record<string, unknown>).code;
  return typeof code === 'string' && code.trim() ? code.trim() : null;
};

const getPlayersPayload = (game: Game) =>
  game.players.map((player) => ({
    name: player.name,
    index: player.index,
    score: player.score,
  }));

export const handleJoinGame = (ws: WebSocket, data: unknown): void => {
  const user = getUserByWebSocket(ws);
  if (!user) {
    sendError(ws, 'Register before joining a game');
    return;
  }
  const code = readJoinCode(data);
  if (!code) {
    sendError(ws, 'Invalid room code');
    return;
  }
  const gameId = getGameIdByRoomCode(code);
  const game = gameId ? gamesById[gameId] : undefined;
  if (!game) {
    sendError(ws, 'Game not found');
    return;
  }
  if (game.status !== 'waiting') {
    sendError(ws, 'Game already started');
    return;
  }
  if (user.index === game.hostId) {
    sendError(ws, 'Host cannot join as a player');
    return;
  }
  const existing = game.players.find((player) => player.index === user.index);
  if (existing) {
    existing.ws = ws;
    sendJson(ws, 'game_joined', { gameId });
    broadcastToGame(game, 'update_players', getPlayersPayload(game));
    return;
  }
  if (
    game.players.some(
      (player) => player.name.toLowerCase() === user.name.toLowerCase(),
    )
  ) {
    sendError(ws, 'Name already taken in this game');
    return;
  }
  const player: Player = { name: user.name, index: user.index, score: 0, ws };
  game.players.push(player);
  sendJson(ws, 'game_joined', { gameId });
  broadcastToGame(game, 'player_joined', {
    playerName: user.name,
    playerCount: game.players.length,
  });
  broadcastToGame(game, 'update_players', getPlayersPayload(game));
};
