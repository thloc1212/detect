// Vercel serverless function to add CORS headers and proxy requests to the actual parse endpoint.
// This lets web clients avoid CORS issues by calling the same-origin /api/parse.
export default async function handler(req, res) {
  // Allow any origin (change to a specific origin in production if you prefer)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    // Preflight request
    res.status(204).end();
    return;
  }

  try {
    const target = 'https://detect-ruby.vercel.app/parse';

    // Forward the incoming request body as JSON to the target
    const forwardRes = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await forwardRes.text();

    // Copy content-type from target
    const contentType = forwardRes.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(forwardRes.status).send(text);
  } catch (err) {
    console.error('Proxy /api/parse error:', err);
    res.status(502).json({ error: 'Proxy error', detail: String(err) });
  }
}
