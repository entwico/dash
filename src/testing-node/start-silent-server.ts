// the rest of the library is typed without node
/// <reference types="node" />
import { type Socket, createServer } from 'node:net';

import { type TrackedSockets, listenLocally, trackSockets } from './test-servers';

export type SilentServer = TrackedSockets & {
  port: number;
  /** Everything the clients sent so far, in bytes. */
  bytesReceived(): number;
};

/**
 * A server that takes every tcp connection and never answers and never closes, the way a hung
 * service looks from its client. For tests of connect and request deadlines over real sockets.
 *
 * `onData` may answer by hand, for a server that goes silent only after some step of a protocol.
 */
export async function startSilentServer(
  onData?: ((socket: Socket, chunk: Buffer) => void) | undefined,
): Promise<SilentServer> {
  let bytesReceived = 0;

  const server = createServer((socket) => {
    socket.on('data', (chunk) => {
      // a socket without an encoding only ever emits buffers
      const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;

      bytesReceived += bytes.length;
      onData?.(socket, bytes);
    });
  });

  const tracked = trackSockets(server);

  return { port: await listenLocally(server), ...tracked, bytesReceived: () => bytesReceived };
}
