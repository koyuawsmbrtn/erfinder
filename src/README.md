# Erfinder Browser - Code-Struktur

## 📁 Projektstruktur

```
erfinder/
├── main.js                    # Electron Main Process
├── index-new.html            # Neue, saubere HTML-Datei
├── index.html                # Alte HTML-Datei (zu ersetzen)
├── package.json              
├── src/
│   ├── styles/               # CSS-Dateien
│   │   ├── main.css         # Haupt-Styling
│   │   ├── tabs.css         # Tab-System
│   │   ├── webview.css      # WebView-Container
│   │   ├── downloads.css    # Download-Manager
│   │   └── ui.css           # UI-Elemente (Loading, Status)
│   └── js/                  # JavaScript-Module
│       ├── main-app.js      # Haupt-App und Initialisierung
│       ├── tab-manager.js   # Tab-Verwaltung
│       ├── webview-manager.js # WebView-Events und Navigation
│       ├── navigation-manager.js # Navigation-Controls
│       ├── ui-manager.js    # UI-Updates und Nachrichten
│       └── ipc-handler.js   # IPC-Kommunikation
```

## 🎯 Module-Übersicht

### **TabManager** (`tab-manager.js`)
- Verwaltet Tab-Erstellung, -Schließung und -Wechsel
- Verantwortlich für Tab-UI-Elemente
- Hält Tab-State und aktiven Tab

### **WebViewManager** (`webview-manager.js`)
- Verwaltet WebView-Events (loading, navigation, etc.)
- Führt URL-Filterung durch
- Direkte WebView-Navigation

### **NavigationManager** (`navigation-manager.js`)
- Navigation-Buttons (Zurück, Vor, Neu laden)
- Keyboard-Shortcuts
- URL-Eingabe und Go-Button

### **UIManager** (`ui-manager.js`)
- Loading-Animationen
- Blocked-Messages
- Security-Status
- Download-Manager UI

### **IPCHandler** (`ipc-handler.js`)
- IPC-Events vom Main-Process
- Menü-Commands
- Download-Events

### **ErfinderApp** (`main-app.js`)
- Initialisiert alle Manager
- Startet die Anwendung
- Globale Koordination

## 🔄 Migration

Um zur neuen Struktur zu wechseln:

1. **Backup erstellen**: `cp index.html index-backup.html`
2. **Neue Version aktivieren**: `mv index-new.html index.html`
3. **Testen**: `npm start`

## 🎨 Vorteile der neuen Struktur

✅ **Modular**: Jede Funktionalität in eigener Datei  
✅ **Wartbar**: Klare Trennung der Verantwortlichkeiten  
✅ **Lesbar**: Keine 1000+ Zeilen Dateien mehr  
✅ **Erweiterbar**: Neue Features einfach hinzufügbar  
✅ **Debugging**: Probleme schneller lokalisierbar  

## 🧩 Klassen-Dependencies

```
ErfinderApp
├── TabManager
├── WebViewManager
├── NavigationManager  
├── UIManager
└── IPCHandler
```

Alle Manager sind über `window.*` global verfügbar und können miteinander kommunizieren.
