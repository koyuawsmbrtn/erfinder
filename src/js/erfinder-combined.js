/**
 * Erfinder Browser - Alle Module in einer Datei für bessere Kompatibilität
 */

// Tab Manager
class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = 0;
        this.nextTabId = 1;
        
        this.tabBar = document.getElementById('tabBar');
        this.newTabBtn = document.getElementById('newTabBtn');
        this.urlInput = document.getElementById('urlInput');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.newTabBtn.addEventListener('click', () => {
            this.createNewTab();
        });
    }
    
    initializeTabs() {
        this.tabs[0] = {
            id: 0,
            title: 'FragFinn',
            url: 'https://www.fragfinn.de',
            isNavigating: false,
            webview: document.getElementById('webview-0'),
            loading: document.getElementById('loading-0'),
            blockedMessage: document.getElementById('blockedMessage-0'),
            container: document.getElementById('webview-container-0')
        };
        
        document.getElementById('tab-0').addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(0);
            }
        });
        
        window.webviewManager.setupWebviewEvents(this.tabs[0]);
        this.switchToTab(0);
    }
    
    createNewTab(url = 'https://www.fragfinn.de', title = 'Neuer Tab') {
        // Sicherheitsprüfung: Doppelte Tabs verhindern
        const existingTab = Object.values(this.tabs).find(tab => tab && tab.url === url);
        if (existingTab) {
            console.log('TabManager: Tab mit URL existiert bereits, wechsle zu Tab', existingTab.id);
            this.switchToTab(existingTab.id);
            return existingTab.id;
        }
        console.log('TabManager: Creating new tab with URL:', url, 'Title:', title);
        const tabId = this.nextTabId++;
        // ...existing code...
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.id = `tab-${tabId}`;
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `
            <img class="tab-favicon" id="tab-favicon-${tabId}" src="assets/icon.png" width="16" height="16" style="vertical-align:middle;margin-right:4px;">
            <span class="tab-title">${title}</span>
            <button class="tab-close" onclick="window.tabManager.closeTab(${tabId})">×</button>
        `;
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tabId);
            }
        });
        this.tabBar.insertBefore(tabElement, this.newTabBtn);
        const container = document.createElement('div');
        container.className = 'webview-container';
        container.id = `webview-container-${tabId}`;
        container.dataset.tabId = tabId;
        container.style.display = 'none';
        container.innerHTML = `
            <webview class="webview" id="webview-${tabId}" src="${url}" partition="persist:main" allowpopups></webview>
            <div class="loading" id="loading-${tabId}">
                <div class="spinner"></div>
            </div>
            <div class="blocked-message" id="blockedMessage-${tabId}">
                <div class="blocked-content">
                    <h2>🚫 Webseite blockiert</h2>
                    <p class="blocked-message-text">Diese Webseite ist für Kinder nicht geeignet.</p>
                </div>
            </div>
        `;
        document.querySelector('.content-area').appendChild(container);
        const tab = {
            id: tabId,
            title: title,
            url: url,
            isNavigating: false,
            webview: document.getElementById(`webview-${tabId}`),
            loading: document.getElementById(`loading-${tabId}`),
            blockedMessage: document.getElementById(`blockedMessage-${tabId}`),
            container: container
        };
        this.tabs[tabId] = tab;
        window.webviewManager.setupWebviewEvents(tab);
        // Favicon-Update Event
        tab.webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                document.getElementById(`tab-favicon-${tabId}`).src = e.favicons[0];
            }
        });
        this.switchToTab(tabId);
        return tabId;
    }
    
    closeTab(tabId) {
        if (Object.keys(this.tabs).filter(id => this.tabs[id]).length <= 1) {
            return;
        }
        
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (tabElement) tabElement.remove();
        
        const container = document.getElementById(`webview-container-${tabId}`);
        if (container) container.remove();
        
        delete this.tabs[tabId];
        
        if (this.activeTabId === tabId) {
            const remainingTabs = Object.keys(this.tabs).map(Number);
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            }
        }
    }
    
    switchToTab(tabId) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.webview-container').forEach(container => {
            container.style.display = 'none';
        });
        
        this.activeTabId = tabId;
        const tab = this.tabs[tabId];
        if (!tab) return;
        
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (tabElement) tabElement.classList.add('active');
        
        tab.container.style.display = 'block';
        this.urlInput.value = tab.webview.getURL() || tab.url;
        
        window.navigationManager.updateNavigationButtons();
        window.uiManager.updateSecurity(true);
    }
    
    updateTabTitle(tabId, title) {
        const tab = this.tabs[tabId];
        if (tab) {
            tab.title = title;
            const titleElement = document.querySelector(`#tab-${tabId} .tab-title`);
            if (titleElement) {
                titleElement.textContent = title.length > 20 ? title.substring(0, 20) + '...' : title;
            }
        }
    }
    
    getActiveTab() {
        return this.tabs[this.activeTabId];
    }
    
    getTabByWebViewId(webViewId) {
        return Object.values(this.tabs).find(t => 
            t && t.webview && t.webview.getWebContentsId && 
            t.webview.getWebContentsId() === webViewId
        );
    }
}

// IPC Handler - WICHTIG: Muss zuerst kommen
class IPCHandler {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
        console.log('IPCHandler: Initializing...');
        this.setupEventListeners();
        console.log('IPCHandler: Ready');
    }
    
    setupEventListeners() {
        console.log('IPCHandler: Setting up create-new-tab listener...');
        this.ipcRenderer.on('create-new-tab', (event, url) => {
            console.log('IPCHandler: Received create-new-tab event for URL:', url);
            if (!window.tabManager) {
                console.error('IPCHandler: TabManager not available!');
                return;
            }
            // Doppelte Tab-Erstellung verhindern
            const existingTab = Object.values(window.tabManager.tabs).find(tab => tab && tab.url === url);
            if (existingTab) {
                console.log('IPCHandler: Tab with URL already exists, switching to it');
                window.tabManager.switchToTab(existingTab.id);
                return;
            }
            let hostname = 'Neuer Tab';
            try {
                hostname = new URL(url).hostname;
            } catch (error) {
                console.log('IPCHandler: Using fallback title');
            }
            window.tabManager.createNewTab(url, hostname);
            console.log('IPCHandler: Tab created successfully');
        });
        
        // Andere Events...
        this.ipcRenderer.on('menu-new-tab', () => {
            if (window.tabManager) window.tabManager.createNewTab();
        });
    }
}

// WebView Manager
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

        webview.addEventListener('page-title-updated', (e) => {
            console.log(`Webview ${tab.id} title updated:`, e.title);
            window.tabManager.updateTabTitle(tab.id, e.title);
        });

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

class NavigationManager {
    constructor() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }
    
    setupEventListeners() {
        const urlInput = document.getElementById('urlInput');
        const goBtn = document.getElementById('goBtn');
        const homeBtn = document.getElementById('homeBtn');
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        const reloadBtn = document.getElementById('reloadBtn');
        
        goBtn.addEventListener('click', () => {
            window.webviewManager.navigateToUrl(urlInput.value);
        });
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.webviewManager.navigateToUrl(urlInput.value);
            }
        });

        homeBtn.addEventListener('click', () => {
            window.webviewManager.goHome();
        });

        backBtn.addEventListener('click', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab && activeTab.webview.canGoBack()) {
                activeTab.webview.goBack();
            }
        });

        forwardBtn.addEventListener('click', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab && activeTab.webview.canGoForward()) {
                activeTab.webview.goForward();
            }
        });

        reloadBtn.addEventListener('click', () => {
            const activeTab = window.tabManager.getActiveTab();
            if (activeTab) {
                activeTab.webview.reload();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+T - Neuer Tab
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                window.tabManager.createNewTab();
            }
            
            // Ctrl+W - Tab schließen
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                const remainingTabs = Object.keys(window.tabManager.tabs).filter(id => window.tabManager.tabs[id]).length;
                if (remainingTabs > 1) {
                    window.tabManager.closeTab(window.tabManager.activeTabId);
                }
            }
            
            // Ctrl+Tab - Nächster Tab
            if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const tabIds = Object.keys(window.tabManager.tabs).map(Number).filter(id => window.tabManager.tabs[id]);
                const currentIndex = tabIds.indexOf(window.tabManager.activeTabId);
                const nextIndex = (currentIndex + 1) % tabIds.length;
                window.tabManager.switchToTab(tabIds[nextIndex]);
            }
            
            // Ctrl+Shift+Tab - Vorheriger Tab
            if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                const tabIds = Object.keys(window.tabManager.tabs).map(Number).filter(id => window.tabManager.tabs[id]);
                const currentIndex = tabIds.indexOf(window.tabManager.activeTabId);
                const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
                window.tabManager.switchToTab(tabIds[prevIndex]);
            }
        });
    }
    
    updateNavigationButtons() {
        const activeTab = window.tabManager.getActiveTab();
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        
        if (activeTab) {
            backBtn.disabled = !activeTab.webview.canGoBack();
            forwardBtn.disabled = !activeTab.webview.canGoForward();
        } else {
            backBtn.disabled = true;
            forwardBtn.disabled = true;
        }
    }
}

class UIManager {
    constructor() {
        this.securityIcon = document.getElementById('securityIcon');
        this.securityText = document.getElementById('securityText');
        this.statusText = document.getElementById('statusText');
        this.downloadManager = document.getElementById('downloadManager');
        this.downloadList = document.getElementById('downloadList');
    }
    
    showLoading(show, tabId = null) {
        const targetTabId = tabId || window.tabManager.activeTabId;
        const tab = window.tabManager.tabs[targetTabId];
        if (tab) {
            tab.loading.classList.toggle('visible', show);
        }
    }
    
    showBlockedMessage(message, tabId = null, searchSuggestion = null) {
        const targetTabId = tabId || window.tabManager.activeTabId;
        const tab = window.tabManager.tabs[targetTabId];
        if (tab) {
            const messageText = tab.blockedMessage.querySelector('.blocked-message-text');
            if (messageText) {
                messageText.textContent = message;
            }
            
            // Buttons aktualisieren
            const blockedContent = tab.blockedMessage.querySelector('.blocked-content');
            const existingButtons = blockedContent.querySelectorAll('button');
            existingButtons.forEach(btn => btn.remove());
            
            // Standard "Zur Startseite" Button
            const homeButton = document.createElement('button');
            homeButton.textContent = '🏠 Zur Startseite';
            homeButton.onclick = () => window.webviewManager.goHome();
            homeButton.style.marginRight = '10px';
            blockedContent.appendChild(homeButton);
            
            // Such-Button wenn Suchvorschlag vorhanden
            if (searchSuggestion) {
                const searchButton = document.createElement('button');
                searchButton.textContent = '🔍 Auf FragFinn suchen';
                searchButton.style.background = '#2196F3';
                searchButton.onclick = () => {
                    window.webviewManager.navigateToUrlDirectly(searchSuggestion, tab);
                    this.hideBlockedMessage(targetTabId);
                    this.updateSecurity(true);
                };
                blockedContent.appendChild(searchButton);
            }
            
            tab.blockedMessage.classList.add('visible');
        }
    }
    
    hideBlockedMessage(tabId = null) {
        const targetTabId = tabId || window.tabManager.activeTabId;
        const tab = window.tabManager.tabs[targetTabId];
        if (tab) {
            tab.blockedMessage.classList.remove('visible');
        }
    }
    
    updateSecurity(secure) {
        if (this.securityIcon) this.securityIcon.classList.toggle('blocked', !secure);
        if (this.securityText) this.securityText.textContent = secure ? 'Sicher' : 'Blockiert';
    }
    
    updateStatus(text) {
        if (this.statusText) this.statusText.textContent = text;
    }
    
    // Download Manager Funktionen
    toggleDownloadManager() {
        if (this.downloadManager) this.downloadManager.classList.toggle('visible');
    }

    updateDownloadProgress(data) {
        if (!this.downloadManager.classList.contains('visible')) {
            this.downloadManager.classList.add('visible');
        }

        let downloadItem = document.getElementById(`download-${data.filename}`);
        if (!downloadItem) {
            downloadItem = this.createDownloadItem(data);
            this.downloadList.appendChild(downloadItem);
        }

        const progressBar = downloadItem.querySelector('.download-progress-bar');
        const statusElement = downloadItem.querySelector('.download-status');
        
        progressBar.style.width = `${data.progress}%`;
        statusElement.textContent = `${data.progress}% - ${this.formatBytes(data.receivedBytes)} von ${this.formatBytes(data.totalBytes)}`;
    }

    completeDownload(data) {
        const downloadItem = document.getElementById(`download-${data.filename}`);
        if (downloadItem) {
            const statusElement = downloadItem.querySelector('.download-status');
            statusElement.textContent = 'Abgeschlossen ✓';
            statusElement.style.color = '#4CAF50';
        }
    }

    failDownload(data) {
        const downloadItem = document.getElementById(`download-${data.filename}`);
        if (downloadItem) {
            const statusElement = downloadItem.querySelector('.download-status');
            statusElement.textContent = 'Fehlgeschlagen ✗';
            statusElement.style.color = '#f44336';
        }
    }

    createDownloadItem(data) {
        const item = document.createElement('div');
        item.className = 'download-item';
        item.id = `download-${data.filename}`;
        
        item.innerHTML = `
            <div class="download-info">
                <div class="download-filename">${data.filename}</div>
                <div class="download-progress">
                    <div class="download-progress-bar" style="width: ${data.progress}%"></div>
                </div>
                <div class="download-status">${data.progress}% - ${this.formatBytes(data.receivedBytes)} von ${this.formatBytes(data.totalBytes)}</div>
            </div>
        `;
        
        return item;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// App-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - Initializing Erfinder...');
    
    // IPC Handler zuerst initialisieren
    window.ipcHandler = new IPCHandler();
    
    // Dann andere Manager
    window.webviewManager = new WebViewManager();
    window.navigationManager = new NavigationManager();
    window.uiManager = new UIManager();
    window.tabManager = new TabManager();
    
    // App starten
    window.tabManager.initializeTabs();
    window.uiManager.updateSecurity(true);
    
    // Globale Funktionen
    window.closeTab = (tabId) => window.tabManager.closeTab(tabId);
    window.toggleDownloadManager = () => window.uiManager.toggleDownloadManager();

    // IPC-Event für gefilterte Navigation behandeln
    window.ipcHandler.ipcRenderer.on('navigate-filtered', (event, data) => {
        const tab = window.tabManager.getTabByWebViewId(data.tabId);
        if (tab) {
            window.webviewManager.navigateToUrlDirectly(data.url, tab);
        }
    });
    
    console.log('Erfinder initialized successfully!');
});

console.log('Erfinder modules loaded!');
