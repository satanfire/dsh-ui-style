/**
 * Host half of the DSH UI style bundle.
 *
 * Styling lives in the Client module. This half owns the one thing the browser
 * cannot do itself: read a provider subscription quota with a stored API key
 * and answer it as JSON on the shared Connection Fetch channel. The key never
 * leaves the Host.
 */

/** Exact Fetch route the Client calls; the browser reads it as `/api/...`. */
const USAGE_PATH = '/api/dsh-ui-style/usage';

/** Provider route served here, keyed by the LLM provider id it belongs to. */
const OPENCODE_GO = 'opencode-go';
/** Credential reference fallback when the provider profile names none. */
const OPENCODE_GO_KEY_REF = 'OPENCODE_GO_API_KEY';
/** The subscription plan's own quota endpoint, from the provider's API. */
const OPENCODE_GO_USAGE_URL = 'https://opencode.ai/zen/go/v1/usage';

/** Upper bound on one quota request, so a slow provider cannot pin the route. */
const REQUEST_TIMEOUT_MS = 8000;
/** Quota moves slowly; one minute keeps repeat reads off the provider. */
const CACHE_MS = 60 * 1000;
/** Loader entry cap, copied from the shipped inventory reader. */
const MAX_ENTRIES = 10000;

/** Cached quota answer shared by every browser tab of this Host. */
const cache = new Map();

/** Answer one route read with a JSON response. */
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/**
 * Read every Loader entry defensively: a generator is pulled one row at a time
 * so a bogus iterable cannot abort the Host.
 * @param ctx - the Host plugin Context.
 * @returns Loader entries, or an empty list when unavailable.
 */
function readEntries(ctx) {
  const loader = ctx.get('loader');
  if (loader === undefined || typeof loader.entries !== 'function') return [];
  try {
    const iterated = loader.entries();
    if (iterated === null || typeof iterated !== 'object') return [];
    if (typeof iterated[Symbol.iterator] !== 'function') return [];
    if (Number.isSafeInteger(iterated.length)) {
      if (iterated.length < 0 || iterated.length > MAX_ENTRIES) return [];
      return Array.from(iterated);
    }
    const rows = [];
    for (const row of iterated) {
      if (rows.length >= MAX_ENTRIES) return [];
      rows.push(row);
    }
    return rows;
  } catch {
    return [];
  }
}

/**
 * Resolve the credential reference one provider route authenticates with.
 * @param ctx - the Host plugin Context.
 * @param provider - LLM provider id.
 * @param fallback - reference used when no profile names one.
 * @returns the reference to resolve.
 */
function keyRefFor(ctx, provider, fallback) {
  for (const entry of readEntries(ctx)) {
    if (entry?.options?.name !== '@deepseek-ai/dsh-llm-pi-ai') continue;
    const profile = entry.options.config?.providers?.[provider];
    const ref = profile?.apiKeyEnv;
    if (typeof ref === 'string' && ref !== '') return ref;
  }
  return fallback;
}

/**
 * Resolve one provider API key through the credentials service, which reads
 * the stored value before any ambient fallback.
 * @param ctx - the Host plugin Context.
 * @param ref - credential reference name.
 * @returns the secret, or null when it is unset.
 */
async function readSecret(ctx, ref) {
  const credentials = ctx.get('credentials');
  if (credentials === undefined || typeof credentials.resolve !== 'function') return null;
  const resolved = await credentials.resolve(ref);
  if (resolved === undefined || resolved === null || typeof resolved.value !== 'string') return null;
  return resolved.value === '' ? null : resolved.value;
}

/** Keep only the fields the panel renders; never forward provider extras. */
function projectUsage(body) {
  const usage = body?.usage;
  if (usage === null || typeof usage !== 'object') return null;
  const windows = {};
  for (const name of ['rolling', 'weekly', 'monthly']) {
    const window = usage[name];
    if (window === null || typeof window !== 'object') continue;
    const percent = typeof window.percent === 'number' && Number.isFinite(window.percent) ? window.percent : null;
    if (percent === null) continue;
    windows[name] = {
      percent,
      status: typeof window.status === 'string' ? window.status : 'ok',
      resetsAt: typeof window.resetsAt === 'string' ? window.resetsAt : null,
    };
  }
  return Object.keys(windows).length === 0 ? null : windows;
}

/** Read the OpenCode Go subscription quota with its platform API key. */
async function readOpencodeGo(ctx) {
  const ref = keyRefFor(ctx, OPENCODE_GO, OPENCODE_GO_KEY_REF);
  const key = await readSecret(ctx, ref);
  if (key === null) return { ok: false, error: `missing-credential:${ref}` };
  const response = await fetch(OPENCODE_GO_USAGE_URL, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${key}`,
      'user-agent': 'dsh-ui-style/1.0',
      accept: 'application/json',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) return { ok: false, error: `http:${response.status}` };
  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: 'protocol' };
  }
  const windows = projectUsage(body);
  if (windows === null) return { ok: false, error: 'protocol' };
  return { ok: true, at: Date.now(), usage: windows };
}

/** Provider id → quota reader. Another subscription adds one entry here. */
const READERS = {
  [OPENCODE_GO]: readOpencodeGo,
};

/** Read one provider quota, reusing the last answer inside the cache window. */
async function readUsage(ctx, provider) {
  const reader = READERS[provider];
  if (reader === undefined) return { ok: false, error: 'unsupported-provider' };
  const cached = cache.get(provider);
  if (cached !== undefined && Date.now() - cached.at < CACHE_MS) return cached.value;
  let value;
  try {
    value = await reader(ctx);
  } catch (error) {
    if (error?.name === 'TimeoutError') value = { ok: false, error: 'timeout' };
    else value = { ok: false, error: 'network' };
  }
  cache.set(provider, { at: Date.now(), value });
  return value;
}

/** Mount the quota route. */
export function apply(ctx) {
  ctx.inject(['connection'], (scoped) => {
    const connection = scoped.connection;
    if (connection === undefined) return;
    const fetchChannel = connection.fetch;
    if (fetchChannel === undefined || typeof fetchChannel.register !== 'function') return;
    scoped.effect(
      () =>
        fetchChannel.register({
          path: USAGE_PATH,
          methods: ['POST'],
          requestBody: 'buffered',
          fetch: async (request) => {
            let payload = {};
            try {
              const parsed = await request.json();
              if (parsed !== null && typeof parsed === 'object') payload = parsed;
            } catch {
              payload = {};
            }
            const provider = typeof payload.provider === 'string' ? payload.provider : '';
            if (provider === '') return json({ ok: false, error: 'provider is required' }, 400);
            return json(await readUsage(ctx, provider));
          },
        }),
      'dsh-ui-style: provider usage route',
    );
  });
}
