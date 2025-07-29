/**
 * Erfinder Browser - UI Management
 * Verwaltet UI-Elemente, Nachrichten und Status-Updates
 */

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
        this.securityIcon.classList.toggle('blocked', !secure);
        this.securityText.textContent = secure ? 'Sicher' : 'Blockiert';
    }
    
    updateStatus(text) {
        this.statusText.textContent = text;
    }
    
    // Download Manager Funktionen
    toggleDownloadManager() {
        this.downloadManager.classList.toggle('visible');
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

// Global verfügbar machen
window.UIManager = UIManager;
