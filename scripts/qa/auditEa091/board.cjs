const { chromium } = require('playwright');
const fs = require('fs');
const dir = process.argv[2], out = process.argv[3], which = process.argv[4];
const img = (n) => `data:image/png;base64,${fs.readFileSync(`${dir}/${n}.png`).toString('base64')}`;
const rows = {
  1: [
    ['A1 故人·驚鴻論劍：撳「推門進去」', 'arc-2', [[0,0,390,180]], [[10,505,370,330]], '改前：誤當戰鬥，開打「宿敵」，短弧唔前進，下月再彈同一事件（死循環）', '改後：正常見面，情誼＋6，約 3 個月後下一拍'],
    ['A2 測試付費玉石：連撳兩下「＋」', 'jade', [[15,120,360,55]], [[15,120,360,55]], '改前：每下＋2400，兩下 4,800，冇上限', '改後：每日一次 600，按鈕變灰'],
    ['B1 突破失敗（同一存檔、同一隨機序列，成功率 62%）', 'break-fail', [[30,465,330,120]], [[60,470,270,120]], '改前：修為全數保留，可以即刻再撳', '改後：修為－13,600（兩成），要儲返滿先可以再試'],
  ],
  2: [
    ['B4 修煉頁：新增兩項銀兩用途', 'practice-2', [[15,500,360,90]], [[25,355,340,190]], '改前：醫館調養之後就係整裝披掛', '改後：名醫療傷（氣血上限一成，回滿）、精工鑄器（40×(境界+1) 兩）'],
    ['B4 門派：捐獻山門', 'sect', [[15,555,360,40]], [[25,508,345,66]], '改前：冇捐獻', '改後：100×(地位+1) 兩，必得晉升，每月一次'],
    ['B4 家族收藏：銀兩換書頁', 'shelf', [[15,470,360,50]], [[15,512,360,85]], '改前：冇', '改後：200 兩換 10 頁，每日 3 次'],
    ['B1＋C2 修為頁：突破說明同歸隱傳位', 'retire', [[20,565,350,45]], [[20,445,350,232]], '改前：寫「失敗修為保留」，冇歸隱入口', '改後：寫明失敗扣 20%；第 8 境起可歸隱傳位（撳兩下確認）'],
  ],
};
const box = (b) => b.map(([x,y,w,h]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:4px solid #d0021b;box-sizing:border-box;border-radius:4px"></div>`).join('');
const panel = (src, boxes, label, cap) => `<div style="width:390px"><div style="font:700 18px sans-serif;margin:6px 0">${label}</div><div style="position:relative;width:390px;height:844px;border:1px solid #999"><img src="${src}" style="width:390px;height:844px;display:block">${box(boxes)}</div><div style="font:15px/1.5 sans-serif;margin-top:6px;color:#333;min-height:46px">${cap}</div></div>`;
const html = `<body style="margin:0;padding:20px;background:#fff;font-family:sans-serif;width:860px">
<div style="font:700 22px sans-serif">第45項審計修正 · 前後對比（第${which}頁）</div>
<div style="font:14px/1.5 sans-serif;color:#555;margin:4px 0 14px">測試情境：正式構建、Chromium、390×844；隔離固定存檔（seed 42、第 8 境洗髓伐毛、銀兩 3,000、青雲劍派地位 1、玉石 0）。改前＝main 9e8662e（EA0.91.0），改後＝本分支未提交改動。</div>
${rows[which].map(([t,n,bb,ab,bc,ac]) => `<div style="margin:18px 0 8px;font:700 20px sans-serif;border-left:6px solid #d0021b;padding-left:8px">${t}</div><div style="display:flex;gap:40px">${panel(img('before-'+n),bb,'改前',bc)}${panel(img('after-'+n),ab,'改後',ac)}</div>`).join('')}</body>`;
(async () => { const b = await chromium.launch({ args:['--no-sandbox'] }); const p = await b.newPage({ viewport:{ width: 900, height: 800 } }); await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close(); })();
