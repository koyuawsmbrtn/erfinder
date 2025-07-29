/**
 * Erfinder Browser - Main Application
 * Initialisiert alle Manager und startet die Anwendung
 */

class ErfinderApp {
    constructor() {
        this.downloads = [];
        this.initializeApp();
    }
    
    initializeApp() {
        console.log('Initializing Erfinder App managers...');
        
        // Manager initialisieren
        window.tabManager = new TabManager();
        console.log('TabManager initialized');
        
        window.webviewManager = new WebViewManager();
        console.log('WebViewManager initialized');
        
        window.navigationManager = new NavigationManager();
        console.log('NavigationManager initialized');
        
        window.uiManager = new UIManager();
        console.log('UIManager initialized');
        
        window.ipcHandler = new IPCHandler();
        console.log('IPCHandler initialized');
        
        // App starten
        this.startApp();
    }
    
    startApp() {
        console.log('DOM Content Loaded - Starting Erfinder Browser');
        
        // Tabs initialisieren
        window.tabManager.initializeTabs();
        
        // UI aktualisieren
        window.navigationManager.updateNavigationButtons();
        window.uiManager.updateSecurity(true);
        window.uiManager.updateStatus('Bereit');
        window.uiManager.hideBlockedMessage();
        
        console.log('Erfinder Browser successfully initialized');
    }
}

// Globale Hilfsfunktionen für Backwards-Compatibility
window.closeTab = (tabId) => window.tabManager.closeTab(tabId);
window.toggleDownloadManager = () => window.uiManager.toggleDownloadManager();

// App starten wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    window.erfinderApp = new ErfinderApp();
});
