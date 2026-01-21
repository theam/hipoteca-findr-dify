# Hipoteca Findr

Tu asistente hipotecario con IA. Resuelve tus dudas sobre hipotecas sin sesgos comerciales.

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar Dify

Copia el archivo de ejemplo y configura tu API key de Dify:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DIFY_API_KEY=app-tu-api-key-de-dify
DIFY_API_URL=https://api.dify.ai/v1
```

### 3. Ejecutar

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura

```
src/
├── app/
│   ├── api/chat/route.ts    # API proxy para Dify
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página del chat
├── components/chat/
│   ├── chat-container.tsx   # Contenedor principal
│   ├── chat-input.tsx       # Input con auto-resize
│   ├── chat-message.tsx     # Burbujas de mensajes
│   └── welcome-screen.tsx   # Pantalla de bienvenida
├── hooks/
│   └── use-chat.ts          # Hook de estado del chat
├── lib/
│   └── dify-client.ts       # Cliente para API de Dify (SSE)
└── types/
    └── chat.ts              # Tipos TypeScript
```

## 🔧 Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DIFY_API_KEY` | Sí | API Key de tu aplicación en Dify |
| `DIFY_API_URL` | No | URL de la API (default: `https://api.dify.ai/v1`) |

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Backend AI**: Dify
- **Streaming**: Server-Sent Events (SSE)

## 📝 Licencia

MIT
