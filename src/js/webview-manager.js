/**
 * Erfinder Browser - WebView Management
 * Verwaltet WebView-Events und Navigation
 */

class WebViewManager {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
    }
    
    setupWebviewEvents(tab) {
        const webview = tab.webview;
        
        webview.addEventListener('dom-ready', () => {
            console.log(`Webview ${tab.id} DOM ready`);
            window.uiManager.showLoading(false, tab.id);
            window.navigationManager.updateNavigationButtons();
            window.uiManager.updateStatus('Bereit');
        });

        webview.addEventListener('did-start-loading', () => {
            console.log(`Webview ${tab.id} started loading`);
            if (!tab.isNavigating) {
                window.uiManager.showLoading(true, tab.id);
                window.uiManager.updateStatus('Lade...');
            }
        });

        webview.addEventListener('did-stop-loading', () => {
            console.log(`Webview ${tab.id} stopped loading`);
            window.uiManager.showLoading(false, tab.id);
            window.navigationManager.updateNavigationButtons();
            window.uiManager.updateStatus('Bereit');
        });

        webview.addEventListener('did-navigate', (e) => {
            console.log(`Webview ${tab.id} navigated to:`, e.url);
            tab.url = e.url;
            if (tab.id === window.tabManager.activeTabId) {
                document.getElementById('urlInput').value = e.url;
            }
            window.navigationManager.updateNavigationButtons();
            
            // Tab-Titel aus URL ableiten
            try {
                const hostname = new URL(e.url).hostname;
                window.tabManager.updateTabTitle(tab.id, hostname);
            } catch (e) {
                window.tabManager.updateTabTitle(tab.id, 'Neuer Tab');
            }
        });

        webview.addEventListener('did-navigate-in-page', (e) => {
            console.log(`Webview ${tab.id} in-page navigation to:`, e.url);
            tab.url = e.url;
            if (tab.id === window.tabManager.activeTabId) {
                document.getElementById('urlInput').value = e.url;
            }
            window.navigationManager.updateNavigationButtons();
        });

        // Keine eigenen Handler für 'new-window' oder Mittelklick! Alles wird nativ über main.js und IPC gehandhabt.

        webview.addEventListener('did-fail-load', (e) => {
            console.error(`Webview ${tab.id} failed to load:`, e.errorDescription);
            window.uiManager.showLoading(false, tab.id);
            window.uiManager.updateStatus('Fehler beim Laden');
        });
    }
    
    async navigateToUrl(url) {
        if (!url.trim()) return;
        
        // URL normalisieren
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        const activeTab = window.tabManager.getActiveTab();
        if (activeTab) {
            await this.checkAndNavigate(url, activeTab);
        }
    }
    
    async checkAndNavigate(url, tab) {
        if (tab.isNavigating) return; // Verhindere mehrfache gleichzeitige Navigation
        
        console.log('Checking URL:', url);
        
        // Nur spezielle URLs ohne API-Check erlauben
        if (url.startsWith('file://') || 
            url.startsWith('data:') ||
            url.startsWith('blob:')) {
            console.log('Safe/local URL, navigating directly');
            this.navigateToUrlDirectly(url, tab);
            window.uiManager.hideBlockedMessage(tab.id);
            window.uiManager.updateSecurity(true);
            return;
        }

        tab.isNavigating = true;
        window.uiManager.showLoading(true, tab.id);
        window.uiManager.updateStatus('Prüfe Webseite...');
        
        try {
            // Erst prüfen ob URL erreichbar ist
            window.uiManager.updateStatus('Prüfe Erreichbarkeit...');
            const reachabilityResult = await this.ipcRenderer.invoke('check-url-reachability', url);
            
            if (!reachabilityResult.reachable) {
                console.log('URL not reachable:', reachabilityResult.error);
                
                let message = `Die Webseite ist nicht erreichbar: ${reachabilityResult.error}`;
                if (reachabilityResult.searchSuggestion) {
                    message += '\n\nMöchtest du stattdessen auf FragFinn suchen?';
                }
                
                window.uiManager.showBlockedMessage(message, tab.id, reachabilityResult.searchSuggestion);
                window.uiManager.updateSecurity(false);
                window.uiManager.showLoading(false, tab.id);
                return;
            }
            
            // Dann gegen FragFinn API prüfen
            window.uiManager.updateStatus('Prüfe Kindersicherheit...');
            const result = await this.ipcRenderer.invoke('check-url', url);
            console.log('Check result:', result);
            
            if (result.allowed) {
                console.log('URL allowed, navigating');
                this.navigateToUrlDirectly(url, tab);
                window.uiManager.hideBlockedMessage(tab.id);
                window.uiManager.updateSecurity(true);
            } else {
                console.log('URL blocked');
                window.uiManager.showBlockedMessage(result.message, tab.id);
                window.uiManager.updateSecurity(false);
                window.uiManager.showLoading(false, tab.id);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            window.uiManager.showBlockedMessage('Fehler beim Laden der Webseite.', tab.id);
            window.uiManager.updateSecurity(false);
            window.uiManager.showLoading(false, tab.id);
        } finally {
            tab.isNavigating = false;
            window.uiManager.updateStatus('Bereit');
        }
    }
    
    navigateToUrlDirectly(url, tab) {
        console.log('Navigating directly to:', url);
        
        if (tab.webview && tab.webview.getWebContentsId) {
            // Über IPC navigieren um will-navigate Handler zu umgehen
            const webViewId = tab.webview.getWebContentsId();
            this.ipcRenderer.invoke('navigate-webview', webViewId, url).then(result => {
                if (result.success) {
                    console.log('WebView navigation successful');
                    tab.url = url;
                    if (tab.id === window.tabManager.activeTabId) {
                        document.getElementById('urlInput').value = url;
                    }
                } else {
                    console.error('WebView navigation failed:', result.error);
                    // Fallback: Normale loadURL verwenden
                    tab.webview.loadURL(url);
                    tab.url = url;
                    if (tab.id === window.tabManager.activeTabId) {
                        document.getElementById('urlInput').value = url;
                    }
                }
            });
        } else {
            // Fallback für ältere WebViews
            tab.webview.loadURL(url);
            tab.url = url;
            if (tab.id === window.tabManager.activeTabId) {
                document.getElementById('urlInput').value = url;
            }
        }
    }
    
    async goHome() {
        console.log('Going home');
        try {
            const result = await this.ipcRenderer.invoke('navigate-home');
            console.log('Home result:', result);
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab) {
                this.navigateToUrlDirectly(result.url, activeTab);
                window.uiManager.hideBlockedMessage(activeTab.id);
                window.uiManager.updateSecurity(true);
            }
        } catch (error) {
            console.error('Home navigation error:', error);
        }
    }
}

// Global verfügbar machen
window.WebViewManager = WebViewManager;
