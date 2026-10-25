const { chromium } = require('playwright');
const fs = require('fs');
const f = JSON.parse(fs.readFileSync('.local-online/audit-ea091/fixtures.json','utf8'));
async function start(b, base, key) {
  const c = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
  for (const g of ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']) await c.route(g, r=>r.abort());
  const fx = { state: f[key], meta: f.meta };
  await c.addInitScript(`(()=>{const f=${JSON.stringify(fx)};if(!localStorage.getItem('qa-fx')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('qa-fx','1');}})();`);
  const p = await c.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(String(e)));
  await p.goto(base); await p.getByRole('button',{name:/^續寫前緣/}).click(); await p.waitForTimeout(1500);
  if (await p.locator('.ink-offline-modal-btn').count()) await p.locator('.ink-offline-modal-btn').click();
  return {c,p,errs};
}
module.exports = { start };
if (require.main === module) (async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--enable-unsafe-swiftshader'] });
  const {p,errs} = await start(b, 'http://127.0.0.1:5192/', 'main');
  await p.screenshot({ path: process.argv[2]+'/x-home.png' });
  console.log(await p.locator('nav button').allInnerTexts());
  console.log(errs); await b.close();
})();
