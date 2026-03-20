// GET /api/career/sync-status
// Returns CareerNet data sync metadata

interface Env {
  CAREER_CACHE?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const kv = context.env.CAREER_CACHE;

  if (!kv) {
    return new Response(JSON.stringify({
      status: 'no-kv',
      message: 'KV namespace not configured. Data is fetched in real-time from CareerNet API.',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const meta = await kv.get('career:sync:meta', 'json');
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
