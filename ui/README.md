# Chatbot Web UI

A React + Vite frontend for the Chatbot API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for the Chatbot API |

## Connecting to the Backend

Ensure your backend server is running and CORS is configured. Update `CORS_ORIGINS` in the backend `.env` to include `http://localhost:5173`:

```
CORS_ORIGINS=["http://localhost:5173"]
```

Or simply keep it as `["*"]` for development (do not use in production).
