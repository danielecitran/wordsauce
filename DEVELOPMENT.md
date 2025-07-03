# wordsauce - Entwicklungsanleitung

## 🎯 Probleme behoben

Die folgenden Probleme wurden identifiziert und behoben:

1. **Socket-Verbindung**: Die Socket-URL war nicht korrekt konfiguriert
2. **Fehlende Socket-Events**: Timer und Score-Updates wurden nicht richtig abgehört
3. **Spiel-Start-Funktionalität**: Es fehlte ein Button um das Spiel zu starten
4. **Antwort-Eingabe**: Spieler konnten keine Antworten eingeben
5. **Timer-Anzeige**: Der Timer wurde nicht korrekt aktualisiert

## 🚀 Anwendung starten

### Server starten

```bash
cd server
npm install
npm run dev
```

Der Server läuft auf: `http://localhost:3001`

### Client starten

```bash
cd client
npm install
npm run dev
```

Der Client läuft auf: `http://localhost:5173`

## 🎮 Spielablauf

1. **Lobby**:
   - Gib einen Namen ein
   - Erstelle einen neuen Raum oder tritt einem bestehenden bei (6-stelliger Code)

2. **Spiel**:
   - Klicke auf "Spiel starten" um eine neue Runde zu beginnen
   - Es wird ein zufälliges Wort ausgewählt
   - Alle 15 Sekunden erscheint ein neuer Hinweis
   - Gib deine Antwort in das Eingabefeld ein
   - Punkte werden basierend auf der Geschwindigkeit vergeben:
     - 1. Hinweis: 4 Punkte
     - 2. Hinweis: 3 Punkte
     - 3. Hinweis: 2 Punkte
     - 4. Hinweis: 1 Punkt

3. **Features**:
   - ✅ Echtzeit-Chat funktioniert
   - ✅ Timer läuft korrekt (60 Sekunden)
   - ✅ Scoreboard aktualisiert sich automatisch
   - ✅ Spiel kann neugestartet werden
   - ✅ Mehrere Spieler können gleichzeitig spielen

## 🔧 Technische Details

### Architektur

- **Frontend**: React + TypeScript + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + Socket.IO
- **Echtzeit-Kommunikation**: WebSockets über Socket.IO

### Socket-Events

- `join-room`: Raum beitreten
- `start-game`: Spiel starten
- `game-start`: Spiel beginnt (Server → Client)
- `timer`: Timer-Update (Server → Client)
- `new-hint`: Neuer Hinweis verfügbar (Server → Client)
- `player-answer`: Antwort übermitteln (Client → Server)
- `update-scores`: Punkte aktualisieren (Server → Client)
- `game-over`: Spiel beendet (Server → Client)
- `chat-message`: Chat-Nachricht senden/empfangen

### Wortdatenbank

Die Wörter sind in `server/data/words.json` gespeichert mit folgendem Format:

```json
{
  "word": "Beispiel",
  "hints": ["Hinweis1", "Hinweis2", "Hinweis3", "Hinweis4"]
}
```

## 🎨 UI/UX Verbesserungen

- Moderne, saubere Neuomorphism-Designsprache
- Responsive Design für alle Bildschirmgrößen
- Smooth Animationen und Übergänge
- Intuitive Benutzerführung
- Accessibility-freundlich

## 🐛 Fehlerbehebung

Falls Probleme auftreten:

1. **Timer funktioniert nicht**: Server neu starten
2. **Chat funktioniert, Spiel nicht**: Socket-Verbindung prüfen (F12 → Network → WS)
3. **Keine Punkte**: Antwort exakt wie das Wort eingeben (Groß-/Kleinschreibung egal)
4. **Spieler sehen sich nicht**: Beide müssen im gleichen Raum sein

## 📝 Nächste Schritte

Mögliche Erweiterungen:

- [ ] Verschiedene Kategorien
- [ ] Schwierigkeitsgrade
- [ ] Bestenlisten speichern
- [ ] Sound-Effekte
- [ ] Mehr Spielmodi
- [ ] Mobile App
