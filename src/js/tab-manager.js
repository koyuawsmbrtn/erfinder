/**
 * Erfinder Browser - Tab Management
 * Verwaltet Tabs, Erstellung, Schließung und Navigation zwischen Tabs
 */

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = 0;
        this.nextTabId = 1;
        
        // DOM-Elemente
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
        // Ersten Tab initialisieren
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
        
        // Event-Listener für ersten Tab hinzufügen
        document.getElementById('tab-0').addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(0);
            }
        });
        
        window.webviewManager.setupWebviewEvents(this.tabs[0]);
        this.switchToTab(0);
    }
    
    createNewTab(url = 'https://www.fragfinn.de', title = 'Neuer Tab') {
        const tabId = this.nextTabId++;
        
        // Tab-Button erstellen
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.id = `tab-${tabId}`;
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `
            <span class="tab-title">${title}</span>
            <button class="tab-close" onclick="window.tabManager.closeTab(${tabId})">×</button>
        `;
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tabId);
            }
        });
        
        // Tab vor dem "+" Button einfügen
        this.tabBar.insertBefore(tabElement, this.newTabBtn);
        
        // Webview-Container erstellen
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
        
        // Tab-Objekt erstellen
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
        
        // Zum neuen Tab wechseln
        this.switchToTab(tabId);
        return tab;
        return tabId;
    }
    
    closeTab(tabId) {
        if (Object.keys(this.tabs).filter(id => this.tabs[id]).length <= 1) {
            return; // Mindestens ein Tab muss offen bleiben
        }
        
        // Tab-Element entfernen
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (tabElement) tabElement.remove();
        
        // Container entfernen
        const container = document.getElementById(`webview-container-${tabId}`);
        if (container) container.remove();
        
        // Tab aus Array entfernen
        delete this.tabs[tabId];
        
        // Falls aktiver Tab geschlossen wurde, zu anderem Tab wechseln
        if (this.activeTabId === tabId) {
            const remainingTabs = Object.keys(this.tabs).map(Number);
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            }
        }
    }
    
    switchToTab(tabId) {
        // Alle Tabs deaktivieren
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.webview-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Aktiven Tab setzen
        this.activeTabId = tabId;
        const tab = this.tabs[tabId];
        if (!tab) return;
        
        // Tab aktivieren
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (tabElement) tabElement.classList.add('active');
        
        // Container anzeigen
        tab.container.style.display = 'block';
        
        // URL-Input aktualisieren
        this.urlInput.value = tab.webview.getURL() || tab.url;
        
        // Navigation-Buttons aktualisieren
        window.navigationManager.updateNavigationButtons();
        
        // Security-Status aktualisieren
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

// Global verfügbar machen
window.TabManager = TabManager;

function createTab(url) {
  // ... Tab erstellen ...
  webview.src = url; // WebView mit gewünschter URL initialisieren
}
