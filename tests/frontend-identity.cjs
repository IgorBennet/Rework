// Execute: node tests/frontend-identity.cjs (Playwright e Edge instalados).
// As capturas ficam na pasta temporária; cada cenário usa uma sessão isolada.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const app = require('../backend/src/app');
const viewports = [[1366,768],[1280,720],[768,1024],[390,844]];
const pages = ['dashboard','ocorrencias','nova-ocorrencia','detalhes-ocorrencia','seriais','containers','metodo-retrabalho','relatorios','usuarios'];
const contrast = (a,b) => {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  };
  const values = [luminance(a),luminance(b)].sort((x,y) => y-x);
  return (values[0]+0.05)/(values[1]+0.05);
};

(async () => {
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const screenshots = fs.mkdtempSync(path.join(os.tmpdir(),'rework-identity-'));
  let browser;
  let passed = 0;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    const run = async (name, test) => {
      const context = await browser.newContext({locale:'pt-BR',colorScheme:'light'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      try {
        await test(page,context);
        assert.deepEqual(errors,[], 'Console sem erros');
        passed++;
        console.log(`PASS ${name}`);
      } finally { await context.close(); }
    };
    const open = (page,file='index') => page.goto(`${base}/${file}.html`);
    const signIn = async (page,profile) => {
      await open(page);
      await page.getByLabel('E-mail',{exact:true}).fill('pessoa@rework.demo');
      await page.getByLabel('Senha',{exact:true}).fill('demo');
      await page.getByLabel('Perfil de acesso',{exact:true}).selectOption(profile);
      await page.getByRole('button',{name:'Entrar no Rework',exact:true}).click();
      await page.waitForURL('**/dashboard.html');
    };
    await run('Login preserva validação, mostrar senha, tema e sessão dos três perfis',async page => {
      await open(page);
      await page.locator('#login [type=submit]').click();
      assert.match(page.url(),/index\.html$/);
      assert.equal(await page.locator('#email').evaluate(el => el.validity.valueMissing),true);
      await page.locator('#email').fill('invalido');
      await page.locator('#password').fill('abc');
      await page.locator('#login [type=submit]').click();
      assert.equal(await page.locator('#email').evaluate(el => el.validity.typeMismatch),true);
      await page.locator('#email').fill('pessoa@rework.demo');
      await page.locator('#login [type=submit]').click();
      assert.equal(await page.locator('#password').evaluate(el => el.validity.tooShort),true);
      await page.locator('#password').fill('demo');
      await page.locator('#togglePassword').click();
      assert.equal(await page.locator('#password').getAttribute('type'),'text');
      assert.equal(await page.locator('#togglePassword').getAttribute('aria-pressed'),'true');
      await page.locator('#togglePassword').click();
      await page.locator('#themePreference').selectOption('dark');
      assert.equal(await page.locator('#password').inputValue(),'demo');
      assert.equal(await page.locator('#email').inputValue(),'pessoa@rework.demo');
      await page.locator('#login [type=submit]').click();
      assert.equal(await page.locator('#loginProfile').evaluate(el => el.validity.valueMissing),true);
      for (const profile of ['Qualidade','Engenharia','Expedição']) {
        await signIn(page,profile);
        assert.equal(await page.evaluate(() => sessionStorage.getItem('rework-profile')),profile);
        assert.equal(await page.evaluate(() => localStorage.getItem('rework-prototype-v3')),null);
        assert.equal(await page.locator('.brand-mark img').evaluate(el => el.complete && el.naturalWidth > 0),true);
        await page.locator('[data-logout]').click();
        await page.waitForURL('**/index.html');
        assert.equal(await page.evaluate(() => sessionStorage.getItem('rework-profile')),null);
      }
    });
    await run('Demonstração mantém Produção no Dashboard e preserva permissões',async page => {
      await open(page);
      await page.locator('#publicDashboard').click();
      await page.waitForURL('**/dashboard.html');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('rework-profile')),'Produção');
      assert.equal(await page.locator('.quality-only').isVisible(),false);
      assert.equal(await page.locator('.sidebar nav a').count(),1);
      await open(page,'ocorrencias');
      await page.waitForURL('**/dashboard.html');
    });
    await run('Teclado alcança acesso e percorre todos os controles do login',async page => {
      await open(page);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement),true);
      await page.keyboard.press('Enter');
      for (const selector of ['#email','#password','#togglePassword','#loginProfile','#login [type=submit]','#publicDashboard']) {
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(selector).evaluate(el => el === document.activeElement),true,selector);
        const outline = await page.locator(selector).evaluate(el => getComputedStyle(el).outlineStyle);
        assert.equal(outline,'solid');
      }
    });
    await run('Conteúdo aprovado é texto real; imagens são apenas símbolos vetoriais',async page => {
      await open(page);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' ').trim(),'Mais controle para um amanhã mais produtivo.');
      assert.equal(await page.locator('.feature-list li').count(),4);
      assert.match(await page.locator('.brand-tagline').innerText(),/CONTROLE · RASTREABILIDADE · RESULTADOS/);
      assert.match(await page.locator('.login-footer').innerText(),/v1.0.0/);
      assert.equal(await page.locator('img').evaluateAll(images => images.every(img => img.getAttribute('src') === 'assets/rework-symbol.svg')),true);
      assert.equal(await page.locator('.login-ambience').getAttribute('aria-hidden'),'true');
      assert.equal(await page.locator('*').evaluateAll(elements => elements.some(el => getComputedStyle(el).backgroundImage.includes('referencia'))),false);
      await page.locator('#languagePreference').selectOption('en');
      await page.waitForFunction(() => document.documentElement.lang === 'en');
      assert.equal(await page.locator('#login-title').innerText(),'Welcome to Rework');
      assert.equal(await page.locator('#loginProfile option').nth(1).getAttribute('value'),'Qualidade');
    });
    await run('Login responsivo nas quatro resoluções em temas claro e escuro',async page => {
      for (const [width,height] of viewports) {
        await page.setViewportSize({width,height});
        for (const theme of ['light','dark']) {
          await open(page);
          await page.locator('#themePreference').selectOption(theme);
          const layout = await page.evaluate(() => {
            const card = document.querySelector('.login-card').getBoundingClientRect();
            return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,cardLeft:card.left,cardRight:card.right,footer:document.querySelector('footer').getBoundingClientRect().bottom};
          });
          assert.ok(layout.width <= width+1, JSON.stringify(layout));
          assert.ok(layout.cardLeft >= 0 && layout.cardRight <= width, JSON.stringify(layout));
          if (width > 1000) assert.ok(layout.height <= height+1, `Desktop: ${JSON.stringify(layout)}`);
          for (const selector of ['#email','#password','#loginProfile','#login [type=submit]','#publicDashboard']) {
            assert.equal(await page.locator(selector).isVisible(),true);
          }
          await page.screenshot({path:path.join(screenshots,`login-${width}x${height}-${theme}.png`),fullPage:true});
        }
      }
    });
    await run('Nova paleta mantém contraste de textos, botões, badges e foco',async page => {
      await signIn(page,'Qualidade');
      for (const theme of ['light','dark']) {
        await page.locator('#themePreference').selectOption(theme);
        for (const file of ['index','ocorrencias','seriais','relatorios']) {
          await open(page,file);
          const pairs = await page.evaluate(() => {
            const selectors = ['.primary','.secondary','.danger','.ok-button','.ng-button','.badge','.priority','.field label','h1','.muted','.hero-description','.demo-help','.brand-tagline'];
            return [...document.querySelectorAll(selectors.join(','))].filter(el => el.getBoundingClientRect().height && !el.closest('dialog:not([open])')).map(el => {
              const style = getComputedStyle(el);
              let node = el;
              let bg = style.backgroundColor;
              while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && node.parentElement) {node = node.parentElement;bg = getComputedStyle(node).backgroundColor;}
              return {name:el.className || el.tagName, fg:style.color,bg,large:parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && Number(style.fontWeight)>=700)};
            });
          });
          for (const pair of pairs) assert.ok(contrast(pair.fg,pair.bg) >= (pair.large?3:4.5), `${theme}/${file}/${pair.name}: ${contrast(pair.fg,pair.bg)}`);
        }
      }
    });
    await run('Demais páginas preservam layout responsivo e impressão em ambos os temas',async page => {
      await signIn(page,'Qualidade');
      for (const theme of ['light','dark']) {
        await page.locator('#themePreference').selectOption(theme);
        for (const [width,height] of viewports) {
          await page.setViewportSize({width,height});
          for (const file of pages) {
            await open(page,file);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),`${theme}/${file}/${width}`);
          }
        }
      }
      await open(page,'relatorios');
      await page.emulateMedia({media:'print'});
      assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
      assert.equal(await page.locator('#reportOutput').evaluate(el => getComputedStyle(el).color),'rgb(17, 17, 17)');
    });
    console.log(`${passed} cenários de identidade aprovados. Capturas: ${screenshots}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error);process.exitCode=1;});
