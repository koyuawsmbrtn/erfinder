# Erfinder

Ein sicherer Electron-basierter Browser für Kinder mit integriertem Content-Filter basierend auf der fragfinn.de API.

## Features

- **Kinderfreundliche Oberfläche**: Einfache Navigation mit großen, farbigen Buttons
- **Content-Filter**: Automatische Überprüfung aller URLs über die fragfinn.de API
- **Download-Manager**: Sicherer Download von Dateien mit Progress-Anzeige
- **Top-Bar Navigation**: Vor/Zurück/Neu laden Buttons und URL-Eingabe
- **Sicherheitsindikator**: Zeigt den Sicherheitsstatus der aktuellen Webseite
- **Home-Button**: Schneller Zugang zur sicheren Startseite (fragfinn.de)

## Installation

1. Repository klonen oder Dateien herunterladen
2. Dependencies installieren:
   ```bash
   bun install
   ```

## Verwendung

### Entwicklung starten
```bash
bun run dev
```

### Produktionsversion starten
```bash
bun start
```

### Build erstellen
```bash
bun run build
```

## Technische Details

### Content-Filter
Der Browser verwendet das mitgelieferte Bash-Skript als Basis für einen JavaScript-basierten Content-Filter:
- Ruft die fragfinn.de URL-Check API auf
- Cached Ergebnisse für 5 Minuten
- Blockiert im Zweifel unsichere Inhalte
- Zeigt kindgerechte Fehlermeldungen

### Sicherheitsfeatures
- Alle externen Links werden im Standard-Browser geöffnet
- Web-Security ist aktiviert
- Downloads werden in den Standard-Download-Ordner gespeichert
- Keine Node.js-Integration in den Webseiten-Inhalten

### Browser-Features
- Webview für sichere Darstellung von Webseiten
- Navigation mit Browser-History
- URL-Validierung und -Normalisierung
- Download-Progress-Tracking
- Responsive Design

## Abhängigkeiten

- **Electron**: ^37.2.4 - Desktop-App-Framework
- **Axios**: ^1.11.0 - HTTP-Client für API-Requests

## Lizenz

MIT License - Siehe package.json für Details

## Entwickelt für

Dieser Browser wurde speziell für Kinder entwickelt und implementiert strenge Sicherheitsmaßnahmen. Er sollte unter Aufsicht von Erwachsenen verwendet werden.

## Support

Bei Fragen oder Problemen können Sie Issues im Repository erstellen.
