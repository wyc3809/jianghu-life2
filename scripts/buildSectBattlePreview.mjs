/** 第57項可下載離線原型；使用同一React／Canvas程式及原圖，無伺服器或帳戶依賴。 */
import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || '.local-online/organization-wars/sect-battle-preview.html');
const manifest = JSON.parse(readFileSync(resolve(root, 'src/prototypes/sectBattle/assets.json'), 'utf8'));
const embedded = Object.fromEntries(Object.values(manifest).map(path => [path, `data:image/webp;base64,${readFileSync(resolve(root, 'public', path)).toString('base64')}`]));
const result = await build({
  absWorkingDir: root, entryPoints: ['src/prototypes/sectBattleStandalone.tsx'],
  outfile: '.local-online/organization-wars/bundle.js', bundle: true, write: false, minify: true, format: 'iife',
  define: { 'import.meta.env.BASE_URL': '"./"', 'import.meta.env.DEV': 'true', 'process.env.NODE_ENV': '"production"' },
  loader: { '.webp': 'dataurl', '.woff2': 'dataurl' },
  plugins: [{ name: 'public-ink-assets', setup(context) {
    context.onResolve({ filter: /^\/ink\// }, args => ({ path: resolve(root, 'public', args.path.slice(1)) }));
  } }],
});
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const licences = { 'Yuji Boku / Jianghu Brush TC': readFileSync(resolve(root, 'design/art/parchment-ui/sources/OFL-yujiboku.txt'), 'utf8') };
for (const name of ['react', 'react-dom', 'scheduler', 'zod', 'immer']) {
  const file = ['LICENSE', 'LICENSE.txt', 'LICENSE.md'].map(base => resolve(root, 'node_modules', name, base)).find(existsSync);
  if (file) licences[name] = readFileSync(file, 'utf8');
}
const legal = JSON.stringify(licences).replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html><html lang="zh-Hant"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>江湖一生 · 門派同場會武原型</title><style>${css}</style><div id="root"></div><script type="application/json" id="bundled-licences">${legal}</script><script>window.__sectPreviewAssets=${JSON.stringify(embedded)};</script><script>${js}</script></html>`;
mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, html);
console.log(`Sect battle preview: ${output} (${Buffer.byteLength(html)} bytes; original bitmap assets embedded)`);
