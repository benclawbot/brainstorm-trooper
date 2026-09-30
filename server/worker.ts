import { Env, handleAi } from './ai';
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return handleAi(request, env);
    if (!env.ASSETS) return new Response('Assets unavailable.', {status:503});
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || path.includes('.')) return asset;
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};
