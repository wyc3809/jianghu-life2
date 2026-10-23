/** 比對指定基線，確認文案檔除中文字串與註解外的AST保持一致。 */
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const base = process.argv[2] ?? 'origin/main';
const files = execFileSync('git', ['diff', '--name-only', base], { encoding: 'utf8' }).trim().split('\n');
const exceptions = new Set(['src/cloud/cloud.ts', 'src/online/client.ts', 'src/components/ink/InkCloudSection.tsx', 'core/life/eventEngine.ts', 'core/life/packAdapter.ts', 'core/life/jianghuEventRepository.ts', 'interfaces/lifeEngine.ts']);
const printer = ts.createPrinter({ removeComments: true });
function semantic(text, file) {
  if (file.endsWith('.json')) {
    const clean = value => {
      if (typeof value === 'string') return /[\u3400-\u9fff]/.test(value) ? '__COPY__' : value;
      if (Array.isArray(value)) return value.map(clean);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'mechanics_text').map(([key, v]) => [key, clean(v)]));
      return value;
    };
    return JSON.stringify(clean(JSON.parse(text)));
  }
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const result = ts.transform(ast, [context => {
    const visit = node => {
      if (typeof node.text === 'string' && /[\u3400-\u9fff]/.test(node.text)) {
        if (ts.isStringLiteral(node)) return ts.factory.createStringLiteral('__COPY__');
        if (ts.isNoSubstitutionTemplateLiteral(node)) return ts.factory.createNoSubstitutionTemplateLiteral('__COPY__');
        if (ts.isTemplateHead(node)) return ts.factory.createTemplateHead('__COPY__');
        if (ts.isTemplateMiddle(node)) return ts.factory.createTemplateMiddle('__COPY__');
        if (ts.isTemplateTail(node)) return ts.factory.createTemplateTail('__COPY__');
        if (ts.isJsxText(node)) return ts.factory.createJsxText('__COPY__');
      }
      return ts.visitEachChild(node, visit, context);
    };
    return root => ts.visitNode(root, visit);
  }]);
  const output = printer.printFile(result.transformed[0]); result.dispose(); return output;
}
const passed = [], failed = [];
for (const file of files) {
  if (!/^(?:src|core|data|content|interfaces|server)\//.test(file) || !/\.(?:ts|tsx|json)$/.test(file) || exceptions.has(file)) continue;
  const before = execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', maxBuffer: 4_000_000 });
  const after = readFileSync(file, 'utf8');
  if (semantic(before, file) === semantic(after, file)) passed.push(file); else failed.push(file);
}
console.log(JSON.stringify({ base, checked: passed.length + failed.length, passed, failed, presentationOnlyAdapters: [...exceptions] }, null, 2));
if (failed.length) process.exitCode = 1;
