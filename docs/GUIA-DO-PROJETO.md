# Guia do projeto Rework

## Objetivo

O Rework é um protótipo para acompanhar produtos bloqueados, organizar o retrabalho e tornar visíveis o andamento operacional e o impacto financeiro de cada ocorrência.

## Fluxo principal

1. A Qualidade cria uma ocorrência e informa produto, defeito, faixa de seriais, quantidade e containers.
2. A Engenharia registra o método de retrabalho e pode anexar seu arquivo.
3. A Qualidade classifica os seriais como OK ou NG durante a inspeção.
4. A Expedição informa os custos por hora de containers parados e atraso de venda.
5. Dashboard e relatórios consolidam quantidade, progresso, custo e prioridade.

## Telas

| Arquivo                    | Finalidade                                      |
| -------------------------- | ----------------------------------------------- |
| `index.html`               | Acesso interno e atalho público da Produção.    |
| `dashboard.html`           | Indicadores e ocorrências abertas ou pendentes. |
| `ocorrencias.html`         | Histórico, filtros, edição e ações por perfil.  |
| `nova-ocorrencia.html`     | Cadastro de bloqueio em duas etapas.            |
| `detalhes-ocorrencia.html` | Resumo da ocorrência selecionada.               |
| `metodo-retrabalho.html`   | Método, responsáveis e arquivo anexo.           |
| `seriais.html`             | Bipagem, classificação e exclusão de seriais.   |
| `containers.html`          | Containers vinculados ao bloqueio.              |
| `usuarios.html`            | Demonstração dos usuários e permissões.         |
| `relatorios.html`          | Filtros, totais, CSV e impressão/PDF.           |

## Organização do frontend

- `styles.css`: tokens de cores, estrutura geral, componentes, tabelas, formulários, responsividade, tema escuro e impressão.
- `app.js`: dados demonstrativos, armazenamento local, permissões, preferências e inicialização de cada tela.
- Cada página HTML possui apenas a estrutura específica da tela; menu e conteúdo dinâmico são montados pelo JavaScript.

Os comentários numerados do CSS separam as áreas principais para facilitar manutenção. Busque pelo título da seção desejada antes de alterar um componente.

## Dados e prioridade

As ocorrências são gravadas na chave `rework-prototype-v3` do `localStorage`. Isso mantém os dados somente no navegador e dispositivo utilizados.

O custo acumulado é a soma do aluguel de containers por hora e do atraso de venda por hora, multiplicada pelo tempo de bloqueio. Quando há custo informado, a prioridade considera o custo acumulado. Sem custo, utiliza quantidade bloqueada e tempo parado.

## Permissões demonstrativas

| Perfil     | Acesso                                         |
| ---------- | ---------------------------------------------- |
| Produção   | Dashboard público para consulta.               |
| Qualidade  | Gestão completa do fluxo demonstrativo.        |
| Engenharia | Dashboard, ocorrências e método de retrabalho. |
| Expedição  | Dashboard, ocorrências e edição de custos.     |

Essas permissões são aplicadas no navegador e servem apenas para demonstração. Segurança real exige autenticação e autorização validadas no servidor.
