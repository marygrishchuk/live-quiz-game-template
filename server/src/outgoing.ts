import { WebSocket } from 'ws';

export const sendJson = (ws: WebSocket, type: string, data: unknown): void => {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type, data, id: 0 }));
};
