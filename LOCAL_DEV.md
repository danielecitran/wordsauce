# 🚀 Lokale Entwicklung - WordSauce

## Installation

```bash
# Dependencies installieren
npm install

# Beide Workspaces installieren
npm ci --workspaces
```

## Development starten

### Option 1: Alles zusammen (empfohlen)

```bash
npm run dev
```

Dies startet:

- 🔵 Server auf http://localhost:3001
- 🟢 Client auf http://localhost:5173

### Option 2: Einzeln starten

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

## URLs

- **Client**: http://localhost:5173
- **Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Features

- ✅ Hot-Reload für Client (Vite)
- ✅ Auto-Restart für Server (ts-node-dev)
- ✅ WebSocket-Verbindung funktioniert automatisch
- ✅ TypeScript-Kompilierung

## Troubleshooting

### Port bereits belegt?

```bash
# Server-Port ändern (in server/src/index.ts):
const PORT = process.env.PORT || 3002;

# Client-URL anpassen (in client/src/socket.ts):
? 'http://localhost:3002' // Neuer Port
```

### Abhängigkeiten neu installieren

```bash
rm -rf node_modules client/node_modules server/node_modules
npm install
```

## Deployment testen

```bash
npm run build
npm run start
# Dann http://localhost:3001 öffnen
```
