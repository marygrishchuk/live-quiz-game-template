import 'dotenv/config';
import { WebSocketServer } from 'ws';

const DEFAULT_PORT = 3000;

function resolvePort(): number {
  const parsed = parseInt(process.env.PORT ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

const PORT = resolvePort();

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`WebSocket server listening at ws://localhost:${PORT}`);
});