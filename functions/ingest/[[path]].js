// Reverse proxy for PostHog so analytics requests stay on pauldrago.com and survive ad blockers.
// /ingest/static/* serves the SDK from PostHog's asset host; everything else goes to the ingestion host.
const API_HOST = 'us.i.posthog.com';
const ASSET_HOST = 'us-assets.i.posthog.com';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/ingest/, '') || '/';
  const host = path.startsWith('/static/') ? ASSET_HOST : API_HOST;

  const headers = new Headers(request.headers);
  headers.delete('cookie');
  const clientIp = request.headers.get('cf-connecting-ip');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return fetch(`https://${host}${path}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    redirect: 'manual',
  });
}
