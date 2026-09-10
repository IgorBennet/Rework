// Execute: node tests/frontend-usability.cjs (Playwright e Edge instalados).
// Cada cenário usa armazenamento isolado; nenhum dado do navegador pessoal é lido.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const app = require('../backend/src/app');
const STORE = 'rework-prototype-v3';

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  let passed = 0;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    async function scenario(name, run, profile = 'Qualidade') {
      const context = await browser.newContext({ locale: 'pt-BR' });
      await context.addInitScript(profile => {
        sessionStorage.setItem('rework-profile', profile);
        localStorage.setItem('rework-language', 'pt');
      }, profile);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await run(page);
        assert.deepEqual(errors, [], 'Não deve haver erro de JavaScript');
        console.log(`PASS ${name}`);
        passed++;
      } finally { await context.close(); }
    }
    const open = (page, path) => page.goto(`${base}/${path}`);
    const text = (page, selector) => page.locator(selector).innerText();
    const chooseDialog = (page, accept) => page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss());
    const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORE);
    const fillFirst = async page => {
      for (const [id, value] of Object.entries({line:'VM10',part:'Inspeção',defect:'Teste',description:'Ocorrência de teste',serialStart:'A100',serialEnd:'A101',blocked:'2',model:'TV',area:'Qualidade',detected:'1'})) await page.locator(`#${id}`).fill(value);
    };
    const fillSecond = async page => {
      for (const [id, value] of Object.entries({classification:'Processo',department:'Engenharia',person:'Pessoa teste',containerId1:'CT-TESTE',containerQty1:'2'})) await page.locator(`#${id}`).fill(value);
    };
    await scenario('As dez páginas carregam sem erros e mantêm os dados demonstrativos', async page => {
      for (const file of ['index','dashboard','ocorrencias','nova-ocorrencia','detalhes-ocorrencia','seriais','containers','metodo-retrabalho','relatorios','usuarios']) {
        await open(page, `${file}.html`);
        assert.equal(await page.locator('h1').count(), 1);
      }
      await open(page, 'ocorrencias.html');
      assert.equal(await page.locator('#occurrenceRows tr').count(), 3);
    });
    await scenario('ID inexistente não seleciona outro registro', async page => {
      for (const file of ['detalhes-ocorrencia','seriais','containers','metodo-retrabalho']) {
        await open(page, `${file}.html?id=INEXISTENTE`);
        assert.match(await text(page, 'h1'), /não encontrada/);
        assert.equal(await page.locator('form').count(), 0);
      }
    });
    await scenario('Cadastro valida cedo, preserva etapas e anuncia a criação', async page => {
      await open(page, 'nova-ocorrencia.html');
      await fillFirst(page);
      await page.locator('#serialEnd').fill('A099');
      await page.locator('#nextStep').click();
      assert.match(await text(page, '#step1Status'), /serial final/);
      assert.equal(await page.locator('#serialEnd').evaluate(el => el === document.activeElement), true);
      await page.locator('#serialEnd').fill('A101');
      await page.locator('#detected').fill('3');
      await page.locator('#nextStep').click();
      assert.match(await text(page, '#step1Status'), /quantidade detectada/);
      await page.locator('#detected').fill('1');
      await page.locator('#nextStep').click();
      await fillSecond(page);
      await page.locator('#backStep').click();
      assert.equal(await page.locator('#step1Title').evaluate(el => el === document.activeElement), true);
      await page.locator('#nextStep').click();
      await page.locator('#containerQty1').fill('1');
      await page.locator('#newOccurrence [type=submit]').click();
      assert.match(await text(page, '#newStatus'), /soma dos containers/);
      await page.locator('#containerQty1').fill('2');
      await page.locator('#newOccurrence [type=submit]').click();
      await page.waitForURL('**/detalhes-ocorrencia.html?id=RW-027');
      assert.match(await text(page, '#pageFeedback'), /RW-027 criada/);
      assert.equal((await stored(page)).length, 4);
    });
    await scenario('Tema mantém campos e cancelar navegação preserva formulário', async page => {
      await open(page, 'nova-ocorrencia.html');
      await page.locator('#line').fill('VM-ALTERADA');
      await page.locator('#themePreference').selectOption('dark');
      assert.equal(await page.locator('#line').inputValue(), 'VM-ALTERADA');
      chooseDialog(page, false);
      await page.getByRole('link', {name:'Cancelar', exact:true}).click();
      assert.match(page.url(), /nova-ocorrencia/);
      assert.equal(await page.locator('#line').inputValue(), 'VM-ALTERADA');
      chooseDialog(page, false);
      await page.locator('#languagePreference').selectOption('en');
      assert.equal(await page.locator('#languagePreference').inputValue(), 'pt');
    });
    await scenario('Editar e cancelar não altera dados; salvar mantém feedback e foco', async page => {
      await open(page, 'ocorrencias.html');
      await page.locator('[data-edit="RW-026"]').click();
      await page.locator('#editDefect').fill('Alteração descartada');
      chooseDialog(page, false);
      await page.locator('#editOccurrence [data-close-dialog]').first().click();
      assert.equal(await page.locator('#editOccurrence').isVisible(), true);
      chooseDialog(page, true);
      await page.keyboard.press('Escape');
      await page.locator('[data-edit="RW-026"]').click();
      assert.equal(await page.locator('#editDefect').inputValue(), 'Fricção');
      await page.locator('#editDefect').fill('Defeito atualizado');
      await page.locator('#editOccurrence [type=submit]').click();
      assert.match(await text(page, '#pageFeedback'), /RW-026 atualizada/);
      assert.equal((await stored(page))[0].defect, 'Defeito atualizado');
      assert.equal(await page.locator('[data-edit="RW-026"]').evaluate(el => el === document.activeElement), true);
    });
    await scenario('Mudança importante exige confirmação sem impor nova regra', async page => {
      await open(page, 'ocorrencias.html');
      await page.locator('[data-edit="RW-026"]').click();
      await page.locator('#editStatus').selectOption('Finalizado');
      chooseDialog(page, false);
      await page.locator('#editOccurrence [type=submit]').click();
      assert.equal(await page.locator('#editOccurrence').isVisible(), true);
      chooseDialog(page, true);
      await page.locator('#editOccurrence [type=submit]').click();
      assert.equal((await stored(page))[0].status, 'Finalizado');
    });
    await scenario('Engenharia salva método e volta para página permitida', async page => {
      await open(page, 'metodo-retrabalho.html?id=RW-025');
      assert.equal(await text(page, '#methodForm [type=submit]'), 'Salvar método');
      await page.locator('#method').fill('Inspecionar e limpar');
      await page.locator('#methodForm [type=submit]').click();
      await page.waitForURL('**/ocorrencias.html');
      assert.match(await text(page, '#pageFeedback'), /Qualidade já pode/);
      assert.equal((await stored(page)).find(item => item.id === 'RW-025').status, 'Iniciado');
    }, 'Engenharia');
    await scenario('Bipagem valida vazio, faixa, duplicidade e confirmação de exclusão', async page => {
      await open(page, 'seriais.html?id=RW-026');
      await page.locator('#okScan').click();
      assert.match(await text(page, '#scanStatus'), /Bipe ou digite/);
      await page.locator('#serialScan').fill('Z999');
      await page.locator('#okScan').click();
      assert.match(await text(page, '#scanStatus'), /fora da faixa/);
      await page.locator('#serialScan').fill('Y5UX3X3L006206');
      await page.locator('#ngScan').click();
      assert.equal(await page.locator('#serialScan').evaluate(el => el === document.activeElement), true);
      assert.match(await text(page, '#scanStatus'), /registrado como NG/);
      await page.locator('#serialScan').fill('Y5UX3X3L006206');
      await page.keyboard.press('Enter');
      assert.match(await text(page, '#scanStatus'), /já foi registrado como NG/);
      chooseDialog(page, false);
      await page.locator('[data-delete-scan="Y5UX3X3L006206"]').click();
      assert.equal((await stored(page))[0].scans.length, 3);
      chooseDialog(page, true);
      await page.locator('[data-delete-scan="Y5UX3X3L006206"]').click();
      assert.equal((await stored(page))[0].scans.length, 2);
    });
    await scenario('Sem método a bipagem continua bloqueada', async page => {
      await open(page, 'seriais.html?id=RW-025');
      assert.equal(await page.locator('#okScan').isDisabled(), true);
      assert.equal(await page.locator('#scanGate').isVisible(), true);
    });
    await scenario('Falha ao salvar bipagem preserva entrada e permite tentar novamente', async page => {
      await open(page, 'seriais.html?id=RW-026');
      await page.evaluate(() => {
        window.originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) { if (key === 'rework-prototype-v3') throw new DOMException('Quota', 'QuotaExceededError'); return window.originalSetItem.call(this,key,value); };
      });
      await page.locator('#serialScan').fill('Y5UX3X3L006206');
      await page.locator('#okScan').click();
      assert.match(await text(page, '#scanStatus'), /Não foi possível salvar/);
      assert.equal(await page.locator('#serialScan').inputValue(), 'Y5UX3X3L006206');
      assert.equal(await page.locator('#scanRows tr').count(), 2);
      await page.evaluate(() => Storage.prototype.setItem = window.originalSetItem);
      await page.locator('#okScan').click();
      assert.equal((await stored(page))[0].scans.length, 3);
    });
    await scenario('Relatórios validam período e evitam exportar filtros não aplicados', async page => {
      await open(page, 'relatorios.html');
      await page.locator('#reportStart').fill('2026-09-02');
      await page.locator('#reportEnd').fill('2026-09-01');
      await page.locator('#generateReport').click();
      assert.match(await text(page, '#reportFeedback'), /data final/);
      await page.locator('#reportEnd').fill('2026-09-03');
      await page.locator('#exportReport').click();
      assert.match(await text(page, '#reportFeedback'), /Gerar relatório antes/);
      await page.locator('#generateReport').click();
      assert.match(await text(page, '#reportCount'), /1 registro/);
      const download = page.waitForEvent('download');
      await page.locator('#exportReport').click();
      assert.match((await download).suggestedFilename(), /\.csv$/);
    });
    await scenario('Sair permanece disponível em menu recolhido e celular; tabelas não cortam ações', async page => {
      await page.setViewportSize({width:375,height:812});
      await open(page, 'ocorrencias.html');
      await page.locator('#toggleSidebar').click();
      assert.equal(await page.locator('[data-logout]').isVisible(), true);
      assert.equal(await page.locator('#toggleSidebar').getAttribute('aria-expanded'), 'false');
      const layout = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth, overflow:getComputedStyle(document.querySelector('.occurrence-table-wrap')).overflowX}));
      assert.ok(layout.scroll <= layout.width + 1, JSON.stringify(layout));
      assert.equal(layout.overflow,'auto');
    });
    await scenario('Método sem alterações não solicita descarte; anexo pode ser baixado e removido com confirmação', async page => {
      await open(page, 'metodo-retrabalho.html?id=RW-026');
      let unexpectedDialogs = 0;
      const rejectUnexpected = dialog => { unexpectedDialogs++; dialog.dismiss(); };
      page.on('dialog', rejectUnexpected);
      await page.getByRole('link', {name:'Voltar às ocorrências', exact:true}).click();
      await page.waitForURL('**/ocorrencias.html');
      assert.equal(unexpectedDialogs, 0);
      page.off('dialog', rejectUnexpected);
      await open(page, 'metodo-retrabalho.html?id=RW-026');
      await page.locator('#methodFile').setInputFiles({name:'metodo.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 teste')});
      await page.locator('#methodForm [type=submit]').click();
      await page.waitForURL('**/seriais.html?id=RW-026');
      assert.equal((await stored(page))[0].methodFile.name, 'metodo.pdf');
      await open(page, 'metodo-retrabalho.html?id=RW-026');
      assert.equal(await page.getByRole('link', {name:'Baixar',exact:true}).count(), 1);
      chooseDialog(page, false);
      await page.locator('#removeMethodFile').click();
      assert.equal((await stored(page))[0].methodFile.name, 'metodo.pdf');
      chooseDialog(page, true);
      await page.locator('#removeMethodFile').click();
      assert.equal((await stored(page))[0].methodFile, null);
      assert.match(await text(page, '#methodFileStatus'), /Anexo removido/);
    });
    await scenario('Anexo acima do limite e erro de leitura preservam método', async page => {
      await open(page, 'metodo-retrabalho.html?id=RW-026');
      await page.locator('#method').fill('Método preservado');
      await page.locator('#methodFile').setInputFiles({name:'grande.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(2*1024*1024+1)});
      await page.locator('#methodForm [type=submit]').click();
      assert.match(await text(page, '#methodFileStatus'), /ultrapassa 2 MB/);
      await page.locator('#methodFile').setInputFiles({name:'falha.pdf',mimeType:'application/pdf',buffer:Buffer.from('teste')});
      await page.evaluate(() => window.FileReader = class {readAsDataURL() {this.onerror();}});
      await page.locator('#methodForm [type=submit]').click();
      assert.match(await text(page, '#methodFileStatus'), /Não foi possível ler o anexo/);
      assert.equal(await page.locator('#method').inputValue(), 'Método preservado');
      assert.equal(await page.locator('#methodForm [type=submit]').isDisabled(), false);
    });
    await scenario('Dados inválidos não são sobrescritos pelos exemplos', async page => {
      await open(page, 'dashboard.html');
      await page.evaluate(key => localStorage.setItem(key, '{invalido'), STORE);
      await open(page, 'seriais.html?id=RW-026');
      assert.match(await text(page, '#pageFeedback'), /exemplos estão sendo exibidos/);
      await page.locator('#serialScan').fill('Y5UX3X3L006206');
      await page.locator('#okScan').click();
      assert.match(await text(page, '#scanStatus'), /dados anteriores/);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), STORE), '{invalido');
    });
    await scenario('Exclusão de ocorrência mantém confirmação, feedback e demais exemplos', async page => {
      await open(page, 'ocorrencias.html');
      chooseDialog(page, false);
      await page.locator('[data-delete-occurrence="RW-026"]').click();
      assert.equal(await page.locator('#occurrenceRows tr').count(), 3);
      chooseDialog(page, true);
      await page.locator('[data-delete-occurrence="RW-026"]').click();
      assert.equal((await stored(page)).length, 2);
      assert.match(await text(page, '#pageFeedback'), /RW-026 excluída/);
    });
    await scenario('Expedição mantém acesso somente aos campos de custo', async page => {
      await open(page, 'ocorrencias.html');
      await page.locator('[data-edit="RW-026"]').first().click();
      assert.equal(await page.locator('#editModel').isDisabled(), true);
      await page.locator('#editContainerCost').fill('45');
      await page.locator('#editOccurrence [type=submit]').click();
      const item = (await stored(page))[0];
      assert.equal(item.containerHourlyCost,45);
      assert.equal(item.model,'UN50M75HAGXZD');
    }, 'Expedição');
    await scenario('Usuário demonstra cadastro e explica sua duração', async page => {
      await open(page, 'usuarios.html');
      await page.locator('#addUser').click();
      await page.locator('#userName').fill('Pessoa teste');
      await page.locator('#userArea').fill('Engenharia');
      await page.locator('#userForm [type=submit]').click();
      assert.equal(await page.locator('#userRows tr').count(),5);
      assert.match(await text(page,'#pageFeedback'), /não cria credenciais/);
      await page.reload();
      assert.equal(await page.locator('#userRows tr').count(),4);
    });
    await scenario('Dez páginas cabem na janela em quatro larguras; rolagem fica nas tabelas', async page => {
      for (const width of [320,375,768,1280]) {
        await page.setViewportSize({width,height:900});
        for (const file of ['index','dashboard','ocorrencias','nova-ocorrencia','detalhes-ocorrencia','seriais','containers','metodo-retrabalho','relatorios','usuarios']) {
          await open(page, `${file}.html`);
          const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
          assert.ok(scroll <= width + 1, `${file}: conteúdo ${scroll}px para janela ${width}px`);
        }
      }
    });
    console.log(`${passed} cenários aprovados.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
