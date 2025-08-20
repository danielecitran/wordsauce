# WordSauce - Das Wörter erraten Spiel

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
