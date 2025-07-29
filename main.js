const { app, BrowserWindow, Menu, dialog, shell, ipcMain, session, webContents } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;
let downloadWindow;

// Kinderfreundlicher Content-Filter basierend auf fragfinn.de
class ContentFilter {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 Minuten Cache
  }

  async checkUrl(url) {
    try {
      // Cache prüfen
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.result;
      }

      // Nonce von der fragfinn.de Seite holen
      const nonceResponse = await axios.get('https://eltern.fragfinn.de/url-check/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      const nonceMatch = nonceResponse.data.match(/value="([^"]*)"/);
      if (!nonceMatch) {
        console.error('Konnte Nonce nicht finden');
        return 'blacklist'; // Im Zweifel blockieren
      }

      const nonce = nonceMatch[1];

      // URL-Check durchführen
      const checkResponse = await axios.post('https://eltern.fragfinn.de/url-check/', 
        `_ff_form_verify_url_nonce=${nonce}&ff_verify_uri=${encodeURIComponent(url)}&ff-form-verify-url-submit=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://eltern.fragfinn.de/url-check/',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const result = checkResponse.data.includes('class="website-not-published"') ? 'blacklist' : 'whitelist';
      
      // Ergebnis cachen
      this.cache.set(url, {
        result: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Fehler beim URL-Check:', error);
      return 'blacklist'; // Im Zweifel blockieren
    }
  }
}

const contentFilter = new ContentFilter();

function createWindow() {
  // Hauptfenster erstellen
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      webviewTag: true,
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Content-Filter wird im Renderer-Prozess gehandhabt

  // Download-Handler
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Download-Ordner festlegen
    const downloadsPath = path.join(require('os').homedir(), 'Downloads');
    const filename = item.getFilename();
    const savePath = path.join(downloadsPath, filename);
    
    item.setSavePath(savePath);
    
    // Download-Status an Renderer weiterleiten
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download unterbrochen');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download pausiert');
        } else {
          const progress = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);
          mainWindow.webContents.send('download-progress', {
            filename: filename,
            progress: progress,
            receivedBytes: item.getReceivedBytes(),
            totalBytes: item.getTotalBytes()
          });
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download abgeschlossen:', savePath);
        mainWindow.webContents.send('download-completed', {
          filename: filename,
          path: savePath
        });
      } else {
        console.log('Download fehlgeschlagen:', state);
        mainWindow.webContents.send('download-failed', {
          filename: filename,
          error: state
        });
      }
    });
  });

  // HTML-Datei laden
  mainWindow.loadFile('index.html');

  // DevTools für Entwicklung (später entfernen)
  // mainWindow.webContents.openDevTools();

  // Set um bereits verarbeitete WebViews zu tracken
  const processedWebViews = new Set();
  // Workaround: Doppelte Events für dieselbe URL verhindern (global für alle WebViews)
  const recentlyOpenedUrls = new Set();
  
  // Event-Handler für WebView-Erstellung
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    const webViewId = webContents.id;
    
    // Verhindere doppelte Handler-Registrierung
    if (processedWebViews.has(webViewId)) {
      console.log('WebView already processed, skipping:', webViewId);
      return;
    }
    processedWebViews.add(webViewId);
    
    // Für moderne Electron-Versionen
    webContents.setWindowOpenHandler((details) => {
        console.log('WebView', webViewId, 'setWindowOpenHandler called with:', details.url, 'features:', details.features);
        if (recentlyOpenedUrls.has(details.url)) {
          console.log('Duplicate setWindowOpenHandler event for', details.url, '- ignoring');
          return { action: 'deny' };
        }
        recentlyOpenedUrls.add(details.url);
        setTimeout(() => recentlyOpenedUrls.delete(details.url), 500);
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('Sending create-new-tab event to renderer');
          mainWindow.webContents.send('create-new-tab', details.url);
        } else {
          console.error('MainWindow not available for create-new-tab');
        }
        return { action: 'deny' };
    });
    
    // will-navigate für alle Navigation abfangen und durch Content-Filter leiten
    webContents.on('will-navigate', (event, navigationUrl) => {
      console.log('WebView', webViewId, 'will-navigate:', navigationUrl, 'from:', webContents.getURL());
      
      const currentUrl = webContents.getURL();
      
      // Initiale Navigation erlauben (about:blank -> erste URL)
      if (!currentUrl || currentUrl === 'about:blank') {
        console.log('WebView', webViewId, 'allowing initial navigation');
        return;
      }
      
      // Alle weiteren Navigationen abfangen
      console.log('WebView', webViewId, 'intercepting navigation for filtering');
      event.preventDefault();

      // Content-Filter prüfen
      contentFilter.checkUrl(navigationUrl).then(result => {
        if (result === 'whitelist') {
          // Erlaubt: WebView navigieren lassen
          webContents.loadURL(navigationUrl);
        } else {
          // Blockiert: Kindgerechte Fehlermeldung anzeigen
          if (mainWindow && !mainWindow.isDestroyed()) {
        webContents.send('navigation-blocked', {
          webViewId,
          url: navigationUrl,
          message: 'Diese Webseite ist für Kinder nicht geeignet.'
        });
          }
          console.log('WebView', webViewId, 'navigation blocked by filter:', navigationUrl);
        }
      }).catch(error => {
        // Fehler beim Filter: Im Zweifel blockieren
        if (mainWindow && !mainWindow.isDestroyed()) {
          webContents.send('navigation-blocked', {
        webViewId,
        url: navigationUrl,
        message: 'Fehler beim Überprüfen der Webseite.'
          });
        }
        console.error('WebView', webViewId, 'navigation blocked due to filter error:', error);
      });
    });
    
    // Cleanup wenn WebView zerstört wird
    webContents.on('destroyed', () => {
      console.log('WebView', webViewId, 'destroyed, removing from processed set');
      processedWebViews.delete(webViewId);
    });
  });

  // DevTools für Entwicklung (später entfernen)
  // mainWindow.webContents.openDevTools();
}

// IPC-Handler für URL-Erreichbarkeitsprüfung
ipcMain.handle('check-url-reachability', async (event, url) => {
  try {
    console.log('Checking reachability for:', url);
    
    // Einfacher HEAD-Request um zu prüfen ob die URL erreichbar ist
    const response = await axios.head(url, {
      timeout: 10000, // 10 Sekunden Timeout
      validateStatus: function (status) {
        return status < 500; // Akzeptiere alle Codes unter 500 (auch 404)
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    console.log('URL reachable, status:', response.status);
    return {
      reachable: true,
      status: response.status
    };
  } catch (error) {
    console.log('URL not reachable:', error.message);

    if (String(error.message) === "") {
      return {
        reachable: false,
        searchSuggestion: null
      };
    }
    
    let errorMessage = 'Unbekannter Fehler';
    let searchSuggestion = null;
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Webseite nicht gefunden';
      // Suchbegriff aus URL extrahieren für FragFinn-Suche
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^www\./, '');
        searchSuggestion = `https://www.fragfinn.de/?stype=&s=${encodeURIComponent(hostname)}`;
      } catch (e) {
        searchSuggestion = 'https://www.fragfinn.de/?stype=&s=kinderseiten';
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Verbindung abgelehnt';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Zeitüberschreitung';
    } else if (error.response && error.response.status >= 500) {
      errorMessage = 'Server-Fehler';
    } else {
      errorMessage = error.message;
    }
    
    return {
      reachable: false,
      error: errorMessage,
      searchSuggestion: searchSuggestion
    };
  }
});

// IPC-Handler für URL-Check (wird vom Renderer vor Navigation aufgerufen)
ipcMain.handle('check-url', async (event, url) => {
  try {
    const result = await contentFilter.checkUrl(url);
    return {
      allowed: result === 'whitelist',
      url: url,
      message: result === 'blacklist' ? 'Diese Webseite ist für Kinder nicht geeignet.' : null
    };
  } catch (error) {
    console.error('Fehler beim URL-Check:', error);
    return {
      allowed: false,
      url: url,
      message: 'Fehler beim Überprüfen der Webseite.'
    };
  }
});

// IPC-Handler für URL-Navigation
ipcMain.handle('navigate-to-url', async (event, url) => {
  try {
    // URL validieren und normalisieren
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    const result = await contentFilter.checkUrl(url);
    
    return {
      allowed: result === 'whitelist',
      url: url,
      message: result === 'blacklist' ? 'Diese Webseite ist für Kinder nicht geeignet.' : null
    };
  } catch (error) {
    return {
      allowed: false,
      url: url,
      message: 'Ungültige URL-Adresse.'
    };
  }
});

// IPC-Handler für Home-Button (sichere Startseite)
ipcMain.handle('navigate-home', () => {
  return {
    allowed: true,
    url: 'https://www.fragfinn.de',
    message: null
  };
});

// IPC-Handler für WebView-Navigation
ipcMain.handle('navigate-webview', async (event, webViewId, url) => {
  try {
    console.log('Navigating WebView', webViewId, 'to:', url);
    
    // WebView finden und navigieren
    const webContents = require('electron').webContents.fromId(webViewId);
    if (webContents && !webContents.isDestroyed()) {
      webContents.loadURL(url);
      return { success: true };
    } else {
      console.error('WebView not found or destroyed:', webViewId);
      return { success: false, error: 'WebView not found' };
    }
  } catch (error) {
    console.error('Error navigating WebView:', error);
    return { success: false, error: error.message };
  }
});

// Menü erstellen
function createMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Neue Registerkarte',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu-new-tab');
          }
        },
        {
          label: 'Registerkarte schließen',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.send('menu-close-tab');
          }
        },
        { type: 'separator' },
        {
          label: 'Beenden',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Zurück',
          accelerator: 'Alt+Left',
          click: () => {
            mainWindow.webContents.send('menu-go-back');
          }
        },
        {
          label: 'Vorwärts',
          accelerator: 'Alt+Right',
          click: () => {
            mainWindow.webContents.send('menu-go-forward');
          }
        },
        {
          label: 'Neu laden',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-reload');
          }
        },
        { type: 'separator' },
        {
          label: 'Nächste Registerkarte',
          accelerator: 'CmdOrCtrl+Tab',
          click: () => {
            mainWindow.webContents.send('menu-next-tab');
          }
        },
        {
          label: 'Vorherige Registerkarte',
          accelerator: 'CmdOrCtrl+Shift+Tab',
          click: () => {
            mainWindow.webContents.send('menu-prev-tab');
          }
        },
        { type: 'separator' },
        {
          label: 'Startseite',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('navigate-home');
          }
        }
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über Erfinder',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über Erfinder',
              message: 'Erfinder v1.0.0',
              detail: 'Ein sicherer Browser für Kinder mit integriertem Content-Filter basierend auf fragfinn.de'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App-Events
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
