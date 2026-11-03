import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { onRequestPost, type Env } from './functions/api/generate';

// .dev.vars ファイルが存在する場合に環境変数として読み込むヘルパー
function loadDevVars(rootDir: string): Record<string, string> {
  const devVarsPath = path.join(rootDir, '.dev.vars');
  const vars: Record<string, string> = {};
  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        vars[key] = val;
      }
    }
  }
  return vars;
}

// ローカル開発時（vite dev）でも Cloudflare Pages Functions (/api/generate) をそのまま実行できるミドルウェアプラグイン
function cloudflarePagesFunctionsDevPlugin(): Plugin {
  return {
    name: 'cloudflare-pages-functions-dev',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);
          const devVars = loadDevVars(process.cwd());
          const env: Env = {
            META_API_KEY: devVars.META_API_KEY || process.env.META_API_KEY,
            META_BASE_URL: devVars.META_BASE_URL || process.env.META_BASE_URL,
            META_MODEL: devVars.META_MODEL || process.env.META_MODEL,
          };

          const webReq = new Request('http://localhost/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: bodyBuffer.toString('utf-8'),
          });

          const webRes = await onRequestPost({ request: webReq, env });
          res.statusCode = webRes.status;
          webRes.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });
          const responseText = await webRes.text();
          res.end(responseText);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Local middleware error',
            })
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), cloudflarePagesFunctionsDevPlugin()],
  };
});
