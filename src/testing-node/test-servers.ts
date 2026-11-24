// the rest of the library is typed without node
/// <reference types="node" />
import type { Server, Socket } from 'node:net';

const closers: (() => unknown)[] = [];

/** Has `close` run by the next `closeTestServers()`. */
export function onCloseTestServers(close: () => unknown): void {
  closers.push(close);
}

/**
 * Ends everything the helpers of this entry started: servers, proxies and the connections they
 * hold. Meant as the `afterEach` of a test file.
 */
export async function closeTestServers(): Promise<void> {
  const pending = closers.toReversed();

  closers.length = 0;

  for (const close of pending) {
    try {
      await close();
    } catch {
      // a connection that was still being set up fails once its server is gone
    }
  }
}

export type TrackedSockets = {
  /** The connections the server holds right now. */
  open(): number;
  /** Every connection the server ever took. */
  accepted(): number;
};

/**
 * Counts the tcp connections of `server`, so a test can tell a socket its client closed from one
 * the client abandoned. `closeTestServers()` destroys the connections and closes the server.
 */
export function trackSockets(server: Server): TrackedSockets {
  const sockets = new Set<Socket>();
  let accepted = 0;

  server.on('connection', (socket) => {
    accepted++;
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
  });

  onCloseTestServers(() => {
    for (const socket of sockets) {
      socket.destroy();
    }

    server.close();
  });

  return { open: () => sockets.size, accepted: () => accepted };
}

/** Listens on a free local port and answers with it. */
export function listenLocally(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (address === null || typeof address === 'string') {
        reject(new Error('the server has no port'));

        return;
      }

      resolve(address.port);
    });
  });
}
