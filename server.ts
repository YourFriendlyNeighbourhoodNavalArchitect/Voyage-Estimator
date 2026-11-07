import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { createServer } from 'vite';
import { asSentence, errorMessage, excerpt } from '#shared/errors.ts';

const ROOT = import.meta.dirname;
const ENV_FILE = path.join(ROOT, '.env');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_TIMEOUT_MS = 30_000;
const MINUTE_MS = 60_000;

interface ProviderSpec {
  /** How the key is sent. */
  auth: { header: string; scheme?: string };
  /** The most requests the provider accepts in a minute, for every browser together. */
  requestsPerMinute: number;
  /** The paths the browser may reach, each with the query parameters it may send. */
  endpoints: Record<string, readonly string[]>;
}

const PROVIDERS: Record<string, ProviderSpec> = {
  vessel: {
    auth: { header: 'x-api-key' },
    requestsPerMinute: 600,
    endpoints: {
      'v0/vessel_inradius': ['lat', 'lon', 'radius', 'type_specific'],
      'v0/vessel_info': ['uuid'],
    },
  },
  bunker: {
    auth: { header: 'Authorization', scheme: 'Token' },
    requestsPerMinute: 60,
    endpoints: { 'prices/latest': ['by_code'] },
  },
};

interface Provider extends ProviderSpec {
  baseUrl: string;
  headers: Record<string, string>;
  pace: () => Promise<void>;
}

/** Spaces requests so that no more than the given number start in any minute. A request waits its turn rather than fail. */
function rateLimiter(requestsPerMinute: number): () => Promise<void> {
  const starts: number[] = [];
  let queue: Promise<void> = Promise.resolve();
  const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  const nextSlot = async (): Promise<void> => {
    for (;;) {
      const now = Date.now();
      while (starts.length > 0 && now - starts[0] >= MINUTE_MS) starts.shift();
      if (starts.length < requestsPerMinute) {
        starts.push(now);
        return;
      }
      await pause(starts[0] + MINUTE_MS - now);
    }
  };
  return () => (queue = queue.then(nextSlot));
}

const providers = new Map<string, Provider>();
for (const [name, spec] of Object.entries(PROVIDERS)) {
  const prefix = `${name.toUpperCase()}_API`;
  const baseUrl = process.env[`${prefix}_URL`]?.trim().replace(/\/+$/, '');
  const key = process.env[`${prefix}_KEY`]?.trim();
  if (!baseUrl || !key) {
    console.warn(`The ${name} provider is not configured. Set ${prefix}_URL and ${prefix}_KEY.`);
    continue;
  }
  const { header, scheme } = spec.auth;
  providers.set(name, { ...spec, baseUrl, headers: { [header]: scheme ? `${scheme} ${key}` : key }, pace: rateLimiter(spec.requestsPerMinute) });
}

/** The query the endpoint accepts, or the reason it is refused. */
function acceptedQuery(query: express.Request['query'], allowed: readonly string[]): URLSearchParams | string {
  const accepted = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (!allowed.includes(name)) return `The parameter "${name}" is not accepted here.`;
    if (typeof value !== 'string') return `The parameter "${name}" must be given once, as text.`;
    accepted.set(name, value);
  }
  return accepted;
}

const app = express();

app.get('/api/:provider/*endpoint', async (req, res) => {
  const name = req.params.provider;
  const provider = providers.get(name);
  if (!provider) return res.status(503).json({ error: `The provider "${name}" is not configured on this server.` });

  const endpoint = req.params.endpoint.join('/');
  const allowed = Object.hasOwn(provider.endpoints, endpoint) ? provider.endpoints[endpoint] : undefined;
  if (!allowed) return res.status(404).json({ error: `The provider "${name}" has no endpoint "${endpoint}" here.` });
  const query = acceptedQuery(req.query, allowed);
  if (typeof query === 'string') return res.status(400).json({ error: query });

  const target = `${provider.baseUrl}/${endpoint}${query.size > 0 ? `?${query}` : ''}`;
  try {
    await provider.pace();
    const answer = await fetch(target, {
      headers: { Accept: 'application/json', ...provider.headers },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const body = await answer.text();
    if (!answer.ok) console.warn(`GET ${target} answered ${answer.status}. ${excerpt(body) || 'The body was empty.'}`);
    const retryAfter = answer.headers.get('retry-after');
    if (retryAfter !== null) res.set('retry-after', retryAfter);
    return res.status(answer.status).type(answer.headers.get('content-type') ?? 'application/json').send(body);
  } catch (error) {
    const reason = asSentence(errorMessage(error));
    console.warn(`GET ${target} did not complete. ${reason}`);
    return res.status(502).json({ error: `The provider "${name}" could not be reached. ${reason}` });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'There is no such endpoint.' });
});

const server = http.createServer(app);
const vite = await createServer({ root: ROOT, server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
app.use(vite.middlewares);

server.on('error', (error) => {
  console.error(`The server could not start. ${asSentence(errorMessage(error))}`);
  process.exit(1);
});
server.listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
