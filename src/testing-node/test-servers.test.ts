/// <reference types="node" />
import { type Socket, connect, createServer } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { startProxy } from './start-proxy';
import { startSilentServer } from './start-silent-server';
import { closeTestServers, listenLocally, trackSockets } from './test-servers';

afterEach(closeTestServers);

/** A server that answers every chunk with the same bytes. */
async function startEcho(): Promise<{ port: number; open: () => number }> {
  const server = createServer((socket) => socket.on('data', (chunk) => socket.write(chunk)));
  const tracked = trackSockets(server);

  return { port: await listenLocally(server), open: tracked.open };
}

type Client = { socket: Socket; received: () => string; closed: () => boolean };

async function connectTo(port: number): Promise<Client> {
  const socket = connect(port, '127.0.0.1');
  let received = '';
  let closed = false;

  socket.on('data', (chunk) => void (received += String(chunk)));
  socket.on('close', () => void (closed = true));
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));

  return { socket, received: () => received, closed: () => closed };
}

const pause = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('trackSockets', () => {
  it('counts the connections a server holds and the ones it ever took', async () => {
    const server = createServer();
    const tracked = trackSockets(server);
    const port = await listenLocally(server);

    const first = await connectTo(port);

    await connectTo(port);
    await expect.poll(() => tracked.open()).toBe(2);

    first.socket.destroy();

    await expect.poll(() => tracked.open()).toBe(1);
    expect(tracked.accepted()).toBe(2);
  });
});

describe('listenLocally', () => {
  it('rejects for a server that cannot listen', async () => {
    const server = createServer();

    trackSockets(server);
    await listenLocally(server);

    await expect(listenLocally(server)).rejects.toThrow();
  });
});

describe('closeTestServers', () => {
  it('closes the connections and frees the port', async () => {
    const echo = await startEcho();
    const client = await connectTo(echo.port);

    await closeTestServers();

    await expect.poll(() => client.closed()).toBe(true);

    const refused = connect(echo.port, '127.0.0.1');
    const error = await new Promise<Error>((resolve) => refused.once('error', resolve));

    expect(error.message).toContain('ECONNREFUSED');
  });
});

describe('startProxy', () => {
  it('carries both directions while nothing is killed', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    client.socket.write('hello');

    await expect.poll(() => client.received()).toBe('hello');
    expect(proxy.open()).toBe(1);
  });

  it.each(['swallow', 'stall'] as const)('carries nothing after kill(%s), and closes nothing', async (mode) => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    client.socket.write('before');
    await expect.poll(() => client.received()).toBe('before');

    proxy.kill(mode);
    client.socket.write('after');
    await pause();

    expect(client.received()).toBe('before');
    expect(client.closed()).toBe(false);
    expect(proxy.open()).toBe(1);
  });

  it('carries connections that are made after a kill', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);

    await connectTo(proxy.port);
    await expect.poll(() => proxy.open()).toBe(1);
    proxy.kill('swallow');

    const later = await connectTo(proxy.port);

    later.socket.write('hello');

    await expect.poll(() => later.received()).toBe('hello');
  });

  it('sees a client leave a swallowed connection', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    await expect.poll(() => proxy.open()).toBe(1);
    proxy.kill('swallow');
    client.socket.destroy();

    await expect.poll(() => proxy.open()).toBe(0);
  });

  it('sees a client leave a stalled connection only once it reads again', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    await expect.poll(() => proxy.open()).toBe(1);
    proxy.kill('stall');

    // the end of a connection comes after its data, and nobody reads the data
    client.socket.write('unread');
    await pause();
    client.socket.destroy();
    await pause();

    expect(proxy.open()).toBe(1);

    proxy.readStalled();

    await expect.poll(() => proxy.open()).toBe(0);
  });

  it('keeps the first kill of a connection: one that swallows is not stalled by a later kill', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    await expect.poll(() => proxy.open()).toBe(1);
    proxy.kill('swallow');
    proxy.kill('stall');

    client.socket.write('unread by a stalled proxy');
    client.socket.destroy();

    await expect.poll(() => proxy.open()).toBe(0);
  });

  it('keeps carrying a live connection through readStalled()', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    await expect.poll(() => proxy.open()).toBe(1);
    proxy.readStalled();
    client.socket.write('hello');

    await expect.poll(() => client.received()).toBe('hello');
  });

  it('closes the client when the server behind it closes a live connection', async () => {
    const echo = await startEcho();
    const proxy = await startProxy(echo.port);
    const client = await connectTo(proxy.port);

    client.socket.write('hello');
    await expect.poll(() => echo.open()).toBe(1);
    await closeTestServers();

    await expect.poll(() => client.closed()).toBe(true);
  });
});

describe('startSilentServer', () => {
  it('takes connections and what they send, and never answers or closes', async () => {
    const silent = await startSilentServer();
    const client = await connectTo(silent.port);

    client.socket.write('hello');

    await expect.poll(() => silent.bytesReceived()).toBe(5);
    await pause();

    expect(client.received()).toBe('');
    expect(client.closed()).toBe(false);
    expect(silent.open()).toBe(1);
    expect(silent.accepted()).toBe(1);
  });

  it('counts bytes, not characters, for a socket that was given an encoding', async () => {
    const silent = await startSilentServer((socket) => socket.setEncoding('utf8'));
    const client = await connectTo(silent.port);

    client.socket.write('é');
    await expect.poll(() => silent.bytesReceived()).toBe(2);

    client.socket.write('é');
    await expect.poll(() => silent.bytesReceived()).toBe(4);
  });

  it('lets a test answer by hand up to the step where it goes silent', async () => {
    const silent = await startSilentServer((socket, chunk) => {
      if (String(chunk) === 'hello') {
        socket.write('welcome');
      }
    });

    const client = await connectTo(silent.port);

    client.socket.write('hello');
    await expect.poll(() => client.received()).toBe('welcome');

    client.socket.write('question');
    await pause();

    expect(client.received()).toBe('welcome');
  });
});
