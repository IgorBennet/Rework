# Backend Rework

Servidor Node.js com Express responsável por publicar o frontend e disponibilizar o endpoint de diagnóstico da API.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação e execução

```powershell
npm.cmd install
npm.cmd start
```

O servidor utiliza a porta `3000` por padrão. A variável de ambiente `PORT` permite configurar outra porta.

## Endereços

- `GET /`: abre o frontend Rework.
- `GET /api/health`: retorna o estado do serviço em JSON.

## Desenvolvimento

```powershell
npm.cmd run dev
```

O modo de desenvolvimento reinicia o servidor quando os arquivos do backend são alterados. A persistência das ocorrências continua sendo local no navegador nesta etapa do projeto.
