import { Logger } from '@nestjs/common';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';

type SetupWSConnection = (conn: WebSocket, req: IncomingMessage) => void;

/**
 * Starts the y-websocket compatible server (Yjs CRDT sync + awareness).
 * Dynamic import avoids ERR_REQUIRE_ESM when Nest runs as CommonJS.
 */
export async function startYjsWebSocketServer(
    host: string,
    port: number,
    logger: Logger,
): Promise<http.Server | null> {
    let setupWSConnection: SetupWSConnection;
    try {
        const mod = await import('@y/websocket-server/utils');
        setupWSConnection = mod.setupWSConnection as SetupWSConnection;
    } catch (e) {
        logger.error(
            `Yjs websocket utils failed to load (collab CRDT sync disabled): ${(e as Error).message}`,
        );
        return null;
    }

    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws, req) => {
        setupWSConnection(ws, req);
    });

    const server = http.createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('DevTinder Yjs CRDT websocket (y-websocket)');
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    return await new Promise((resolve, reject) => {
        server.once('error', (err) => {
            logger.error(`Yjs WebSocket server failed on ${host}:${port} — ${err.message}`);
            reject(err);
        });
        server.listen(port, host, () => {
            logger.log(`Yjs CRDT (y-websocket) listening on ws://${host}:${port}`);
            resolve(server);
        });
    });
}
