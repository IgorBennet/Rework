// Run: node tests/frontend-accessibility.cjs. Uses isolated browser storage.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const app = require('../backend/src/app');
(async () => {
 const server = app.listen(0, '127.0.0.1');
 await new Promise(r => server.once('listening', r));
 const browser = await chromium.launch({channel:'msedge'});
 let checks = 0;
 try {
  const context = await browser.newContext({locale:'pt-BR'});
  await context.addInitScript(() => { sessionStorage.setItem('rework-profile','Qualidade'); localStorage.setItem('rework-language','pt'); });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const open = file => page.goto('http://127.0.0.1:' + server.address().port + '/' + file + '.html');
  const audit = async name => {
   await page.addScriptTag({path:require.resolve('axe-core')});
   const violations = await page.evaluate(async () => (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   assert.deepEqual(violations,[],name); checks++;
  };
  for (const theme of ['light','dark']) {
   for (const file of ['index','dashboard','ocorrencias','nova-ocorrencia','detalhes-ocorrencia','seriais','containers','metodo-retrabalho','relatorios','usuarios']) {
    await open(file);
    await page.locator('#themePreference').selectOption(theme);
    await audit(theme + '/' + file);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('main').count(),1);
    assert.equal(await page.locator('table:not(:has(caption))').count(),0);
    assert.equal(await page.locator('thead th:not([scope=col])').count(),0);
    await page.setViewportSize({width:320,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file + ' reflow');
    await page.addStyleTag({content:'* { line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important; } p { margin-bottom:2em !important; }'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file + ' text spacing');
    await page.setViewportSize({width:1280,height:720});
   }
  }
  for (const [file,trigger] of [['ocorrencias','[data-edit]'],['usuarios','#addUser']]) {
   await open(file);
   await page.locator(trigger).first().focus();
   await page.keyboard.press('Enter');
   await audit(file + ' dialog');
   for(let i=0;i<35;i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(()=>document.activeElement === document.body || !!document.activeElement.closest('dialog[open]')),'Modal focus containment'); }
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('dialog[open]').count(),0);
   assert.ok(await page.locator(trigger).first().evaluate(el=>el===document.activeElement));
  }
  await open('dashboard');
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Enter');
  assert.ok(await page.locator('main').evaluate(el=>el===document.activeElement));
  assert.deepEqual(errors,[]);
  console.log(checks + ' axe audits passed; semantics, 320px reflow, text spacing, modal keyboard and skip link passed.');
 } finally { await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{ console.error(e); process.exitCode=1; });
