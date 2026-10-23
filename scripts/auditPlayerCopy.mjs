/** 只掃描可顯示的字串與JSX文字；不處理註解、著色器或舊服務錯誤鍵值。 */
import ts from 'typescript';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'core', 'data', 'content', 'interfaces', 'server', 'supabase/functions'];
const technicalFiles = new Set(['src/fx/highlight/duel/shaders.ts', 'src/fx/highlight/scene/renderer.ts']);
const dialect = /[唔嘅咗喺佢揀畀俾嚟咁冇啲嗰乜咩睇攞拎撳啱搵嘢喎喇啫噉]|呢(?:個|度|本|場|套|張)|即刻|等緊|同埋|先至|個鐘|幾多|點樣|而家/;
const emptyPhrases = /留白即命運|改寫一寸|失敗寫得很具體|這一局輸了細節|你把恨意與教訓一起嚥進肚裡|人沒救下，物沒留下，只多了一道記得疼的疤/;
const hits = [];
let scanned = 0;
function scan(file) {
  if (technicalFiles.has(file)) return;
  const source = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  function visit(node) {
    const isText = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node);
    // 舊錯誤原文只作查表鍵，不會原樣顯示。
    const aliasKey = file === 'src/ui/serviceErrorCopy.ts' && node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name === node;
    if (isText && !aliasKey && /[\u3400-\u9fff]/.test(node.text)) {
      scanned += 1;
      if (dialect.test(node.text) || emptyPhrases.test(node.text)) hits.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, text: node.text.trim().slice(0, 100) });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.(?:ts|tsx|json|mjs)$/.test(file)) scan(file);
  }
}
roots.forEach(walk);
for (const hit of hits) console.error(`${hit.file}:${hit.line} ${hit.text}`);
console.log(`player-copy: ${scanned}段中文字串；口語及禁句${hits.length}處`);
if (hits.length) process.exitCode = 1;
