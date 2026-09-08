# Rework

Protótipo web para acompanhar bloqueios e retrabalhos de produção. A aplicação reúne ocorrências, faixas de seriais, containers, métodos de retrabalho, custos, prioridades e relatórios em uma única interface.

## Como executar

Requisitos: Node.js 18 ou superior e npm.

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Abra `http://localhost:3000` no navegador. Para usar outra porta, defina a variável de ambiente `PORT` antes de iniciar o servidor.

## Perfis demonstrativos

- **Produção:** abre o Dashboard público, sem login, apenas para consulta.
- **Qualidade:** cria, edita e exclui ocorrências, define métodos, realiza bipagens, administra usuários e gera relatórios.
- **Engenharia:** consulta ocorrências e inclui o método e o arquivo de retrabalho.
- **Expedição:** consulta ocorrências e informa os custos de containers e de atraso de vendas.

O formulário de acesso não contém credenciais salvas ou exibidas. Nesta versão demonstrativa, campos preenchidos são aceitos conforme o perfil escolhido; autenticação real ainda depende de integração com backend e banco de dados.

## Recursos disponíveis

- Dashboard restrito a ocorrências iniciadas ou pendentes.
- Cadastro e edição de ocorrências e faixas de seriais.
- Registro e exclusão de seriais classificados como OK ou NG.
- Método de retrabalho com anexo de até 2 MB.
- Custos por hora e prioridade automática baixa, média ou alta.
- Filtros por texto, data e status.
- Relatórios filtráveis, impressão/PDF e exportação CSV.
- Tema claro, escuro ou do sistema; interface em português, inglês ou idioma do sistema.
- Menu lateral recolhível e permissões visuais por perfil.

## Estrutura

```text
Rework/
├── backend/          servidor Node.js e Express
├── frontend/         páginas, estilos e regras do protótipo
├── database/         reservado para a futura camada de dados
└── docs/             documentação funcional e técnica
```

O arquivo central do frontend é `frontend/app.js`. Os dados demonstrativos e as alterações feitas pelo usuário ficam no `localStorage` do navegador; o perfil ativo fica no `sessionStorage`.

## Documentação

- [Guia funcional e técnico](docs/GUIA-DO-PROJETO.md)
- [Documentação do backend](backend/README.md)

## Limitações atuais

Este repositório ainda é um protótipo de frontend. Não há autenticação real, banco de dados, sincronização entre computadores, recuperação de senha ou armazenamento de anexos no servidor. Não use dados pessoais, confidenciais ou arquivos de produção nesta versão.
