# Probio

Probio é um link na bio premium para profissionais autônomos e pequenos negócios que vendem pelo WhatsApp. O projeto foi pensado como um MVP simples, organizado e fácil de entender.

## Como instalar

### Pré-requisitos
- Node.js 18+
- npm

### Passos

1. Clone o repositório.
2. Instale as dependências do backend e do frontend.

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Como rodar o backend

```bash
cd backend
npm start
```

O servidor roda em `http://localhost:3001` e cria automaticamente o banco SQLite local (`probio.sqlite`).

## Como rodar o frontend

```bash
cd frontend
npm run dev
```

A interface fica em `http://localhost:5173`. Caso precise mudar a URL do backend, crie um arquivo `.env` em `frontend/` com:

```bash
VITE_API_URL=http://localhost:3001
```
