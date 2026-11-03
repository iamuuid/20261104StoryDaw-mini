import { onRequestPost, type Env } from './functions/api/generate';

// Cloudflare Workers Static Assets + /api/generate ルーティング用エントリポイント
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /api/generate の場合はネーム指示書生成処理を実行
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      return onRequestPost({ request, env });
    }

    // それ以外のリクエストは ./dist の静的アセットを返す
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
