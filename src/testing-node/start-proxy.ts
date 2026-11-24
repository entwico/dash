// the rest of the library is typed without node
/// <reference types="node" />
import { type Socket, connect, createServer } from 'node:net';

import { type TrackedSockets, listenLocally, onCloseTestServers, trackSockets } from './test-servers';

type Link = 'pass' | 'swallow' | 'stall';

export type TestProxy = TrackedSockets & {
  port: number;
  /**
   * Stops carrying the connections the proxy holds now (`open()`), without closing them; later
   * ones pass again.
   * `swallow` reads and drops both directions, `stall` stops reading, so the writes of the client
   * back up.
   */
  kill(mode: 'swallow' | 'stall'): void;
  /**
   * Reads the stalled connections again, still carrying nothing. The end of a connection comes
   * after its data: while what the client sent is unread, the proxy cannot see that the client
   * left, and `open()` does not go down.
   */
  readStalled(): void;
};

/**
 * A tcp hop in front of a local server that can stop carrying a connection without closing it,
 * the way a dead peer or a broken network path looks from the client: no error, no close, only
 * silence. For tests of timeouts, keep-alives and reconnects over real sockets.
 */
export async function startProxy(targetPort: number, targetHost = '127.0.0.1'): Promise<TestProxy> {
  const links: { mode: Link; client: Socket; upstream: Socket }[] = [];

  const server = createServer((client) => {
    const upstream = connect(targetPort, targetHost);
    const link = { mode: 'pass' as Link, client, upstream };

    links.push(link);
    upstream.on('error', () => {});
    onCloseTestServers(() => upstream.destroy());

    client.on('data', (chunk) => {
      if (link.mode === 'pass') {
        upstream.write(chunk);
      }
    });

    upstream.on('data', (chunk) => {
      if (link.mode === 'pass') {
        client.write(chunk);
      }
    });

    upstream.on('close', () => {
      if (link.mode === 'pass') {
        client.destroy();
      }
    });

    client.on('close', () => upstream.destroy());
  });

  const tracked = trackSockets(server);

  return {
    port: await listenLocally(server),
    ...tracked,

    kill(mode) {
      for (const link of links) {
        if (link.mode !== 'pass') {
          continue;
        }

        link.mode = mode;

        if (mode !== 'stall') {
          continue;
        }

        link.client.pause();
        link.upstream.pause();
      }
    },

    readStalled() {
      for (const link of links) {
        if (link.mode !== 'stall') {
          continue;
        }

        link.mode = 'swallow';
        link.client.resume();
        link.upstream.resume();
      }
    },
  };
}
