import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { handleSocketClosed } from './utils/disconnect.js';
import { handleIncoming } from './utils/incoming.js';

const DEFAULT_PORT = 3000;

const resolvePort = (): number => {
  const parsed = parseInt(process.env.PORT ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
};

const PORT = resolvePort();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    handleIncoming(ws, raw);
  });
  const onDisconnect = () => handleSocketClosed(ws);
  ws.on('close', onDisconnect);
  ws.on('error', onDisconnect);
});

wss.on('listening', () => {
  console.log(`WebSocket server listening at ws://localhost:${PORT}`);
});
