/**
 * Erfinder Browser - IPC Events Handler
 * Verwaltet die Kommunikation zwischen Main- und Renderer-Prozess
 */

class IPCHandler {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
        console.log('IPCHandler: Setting up event listeners...');
        this.setupEventListeners();
        console.log('IPCHandler: Event listeners setup complete');
    }
    
    setupEventListeners() {
        // URL-Block Events
        this.ipcRenderer.on('url-blocked', (event, url) => {
            window.uiManager.showBlockedMessage(`Die Webseite "${url}" ist für Kinder nicht geeignet.`, null, null, url);
            window.uiManager.updateSecurity(false);
        });

        this.ipcRenderer.on('navigate-home', () => {
            window.webviewManager.goHome();
        });

        // Menü-Events
        this.ipcRenderer.on('menu-new-tab', () => {
            window.tabManager.createNewTab();
        });

        this.ipcRenderer.on('menu-close-tab', () => {
            const remainingTabs = Object.keys(window.tabManager.tabs).filter(id => window.tabManager.tabs[id]).length;
            if (remainingTabs > 1) {
                window.tabManager.closeTab(window.tabManager.activeTabId);
            }
        });

        // Tab-Erstellung von main.js
        this.ipcRenderer.on('create-new-tab', (event, url) => {
            // Sicherstellen, dass TabManager verfügbar ist
            if (!window.tabManager) {
                setTimeout(() => this.ipcRenderer.emit('create-new-tab', event, url), 100);
                return;
            }
            // Tab nur einmal öffnen, Logik in handleCreateNewTab
            this.handleCreateNewTab(url);
        });
    }
    
    handleCreateNewTab(url) {
        // Doppelte Tab-Erstellung verhindern
        const existingTab = Object.values(window.tabManager.tabs).find(tab => tab && tab.url === url);
        if (existingTab) {
            window.tabManager.switchToTab(existingTab.id);
            return;
        }
        let hostname = 'Neuer Tab';
        try {
            hostname = new URL(url).hostname;
        } catch (error) {}
        window.tabManager.createNewTab(url, hostname);

        // Navigation-Events
        this.ipcRenderer.on('menu-go-back', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab && activeTab.webview.canGoBack()) {
                activeTab.webview.goBack();
            }
        });

        this.ipcRenderer.on('menu-go-forward', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab && activeTab.webview.canGoForward()) {
                activeTab.webview.goForward();
            }
        });

        this.ipcRenderer.on('menu-reload', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab) {
                activeTab.webview.reload();
            }
        });

        this.ipcRenderer.on('menu-next-tab', () => {
            const tabIds = Object.keys(window.tabManager.tabs).map(Number).filter(id => window.tabManager.tabs[id]);
            const currentIndex = tabIds.indexOf(window.tabManager.activeTabId);
            const nextIndex = (currentIndex + 1) % tabIds.length;
            window.tabManager.switchToTab(tabIds[nextIndex]);
        });

        this.ipcRenderer.on('menu-prev-tab', () => {
            const tabIds = Object.keys(window.tabManager.tabs).map(Number).filter(id => window.tabManager.tabs[id]);
            const currentIndex = tabIds.indexOf(window.tabManager.activeTabId);
            const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
            window.tabManager.switchToTab(tabIds[prevIndex]);
        });

        // Download-Events
        this.ipcRenderer.on('download-progress', (event, data) => {
            window.uiManager.updateDownloadProgress(data);
        });

        this.ipcRenderer.on('download-completed', (event, data) => {
            window.uiManager.completeDownload(data);
        });

        this.ipcRenderer.on('download-failed', (event, data) => {
            window.uiManager.failDownload(data);
        });

        // Gefilterte Navigation von main.js
        this.ipcRenderer.on('navigate-filtered', async (event, data) => {
            console.log('Received navigate-filtered event:', data);
            const { tabId, url } = data;
            
            // Tab anhand der WebView-ID finden
            const tab = window.tabManager.getTabByWebViewId(tabId);
            
            if (tab) {
                console.log('Found tab for filtered navigation:', tab.id);
                await window.webviewManager.checkAndNavigate(url, tab);
            } else {
                console.log('Tab not found for WebView ID:', tabId);
                // Fallback: In aktivem Tab navigieren
                const activeTab = window.tabManager.getActiveTab();
                if (activeTab) {
                    await window.webviewManager.checkAndNavigate(url, activeTab);
                }
            }
        });
    }
}

// Global verfügbar machen
window.IPCHandler = IPCHandler;
