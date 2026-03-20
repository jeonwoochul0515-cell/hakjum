// GET /api/neis/sync-status
// Returns NEIS data sync metadata

interface Env {
  NEIS_CACHE?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const kv = context.env.NEIS_CACHE;

  if (!kv) {
    return new Response(JSON.stringify({
      status: 'no-kv',
      message: 'KV namespace not configured. Data is fetched in real-time from NEIS API.',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const meta = await kv.get('neis:sync:meta', 'json');
    return new Response(JSON.stringify(meta || { status: 'no-data', message: 'No sync data found' }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to read sync status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
