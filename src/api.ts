import { WebSocketManager, WebSocketShardStatus } from '@discordjs/ws';
import { createServer } from 'node:http';

interface Status {
  id: number;
  status: WebSocketShardStatus;
}

export const httpServer = (manager: WebSocketManager) => createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname !== '/status') {
    res.statusCode = 404;
    await res.write(JSON.stringify({
      error: {
        message: 'Not Found',
        code: 'not_found'
      }
    }));

    await res.end();
    return;
  }

  const states = await manager.fetchStatus();
  const out = states
    .reduce((acc, status, id) => {
      acc.push({
        id: id,
        status: status
      });

      return acc;
    }, [] as Status[]);

  await res.write(JSON.stringify(out));
  await res.end();
}).listen(8080);