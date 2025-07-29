<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Erfinder - Copilot Anweisungen

Dies ist eine Electron-basierte Anwendung für einen kinderfreundlichen Browser mit integriertem Content-Filter.

## Projektstruktur
- `main.js` - Haupt-Electron-Prozess mit Content-Filter-Logik
- `index.html` - Browser-UI mit Webview und Download-Manager
- Die Anwendung nutzt die fragfinn.de API für Kindersicherheit

## Entwicklungsrichtlinien
- Immer Kindersicherheit priorisieren
- Content-Filter soll restriktiv sein (im Zweifel blockieren)
- UI soll kinderfreundlich und einfach zu bedienen sein
- Fehlerbehandlung ist wichtig für Stabilität
- Deutsche Sprache für UI-Texte verwenden

## Content-Filter
- Basiert auf fragfinn.de API
- Cacht Ergebnisse für 5 Minuten
- Blockiert unsichere URLs standardmäßig
- Zeigt kindgerechte Fehlermeldungen

## Features
- Navigation mit Vor/Zurück/Neu laden
- URL-Eingabe mit Validierung
- Home-Button zur sicheren Startseite
- Download-Manager mit Progress-Anzeige
- Sicherheitsindikator in der Statusleiste
