/**
 * Erfinder Browser - Navigation Management
 * Verwaltet Navigation-Buttons und Keyboard-Shortcuts
 */

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

// Global verfügbar machen
window.NavigationManager = NavigationManager;
