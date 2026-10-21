import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

// 同一份受測Node／純核心源碼，產生可直接部署嘅Deno模組；唔包含任何金鑰。
await mkdir('.local-online/edge', { recursive: true });
await build({ stdin: { contents: `import { createPairHandler } from './server/online/pairHttp';
Deno.serve(createPairHandler({ url: Deno.env.get('SUPABASE_URL'), anonKey: Deno.env.get('SUPABASE_ANON_KEY'), serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') }));`, resolveDir: process.cwd(), sourcefile: 'edge-entry.ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', outfile: '.local-online/edge/index.ts', tsconfig: 'tsconfig.json', minify: false });
await writeFile('.local-online/edge/deno.json', JSON.stringify({ compilerOptions: { lib: ['deno.ns', 'dom', 'esnext'] } }));
console.log('二人試場Edge bundle已建立（無憑證）。');
