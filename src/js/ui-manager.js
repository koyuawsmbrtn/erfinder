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
    
    showBlockedMessage(message, tabId = null, searchSuggestion = null, url = null) {
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
            
            // Whitelist-Button
            if (url && window.WhitelistManager && window.WhitelistManager.addToWhitelist) {
                const whitelistButton = document.createElement('button');
                whitelistButton.textContent = '🔓 Website zur Whitelist hinzufügen';
                whitelistButton.style.background = '#fff';
                whitelistButton.style.color = '#444';
                whitelistButton.style.border = '1px solid #ddd';
                whitelistButton.style.boxShadow = '0 1px 4px #0001';
                whitelistButton.style.borderRadius = '8px';
                whitelistButton.style.fontWeight = 'bold';
                whitelistButton.style.padding = '8px 24px';
                whitelistButton.style.marginLeft = '10px';
                whitelistButton.style.marginTop = '10px';
                whitelistButton.onclick = () => {
                    this.showPinModal(url, targetTabId);
                };
                blockedContent.appendChild(whitelistButton);
            }
            tab.blockedMessage.classList.add('visible');
        }
    }

    showPinModal(url, tabId, opts = {}) {
        const modal = document.getElementById('pinModal');
        const pinInput = document.getElementById('pinInput');
        const pinCancelBtn = document.getElementById('pinCancelBtn');
        const pinError = document.getElementById('pinError');
        const pinModalText = document.getElementById('pinModalText');
        modal.style.display = 'flex';
        pinInput.value = '';
        pinError.style.display = 'none';
        pinInput.focus();
        if (opts.text) pinModalText.textContent = opts.text;
        let submitted = false;
        // Autosubmit bei 4 Stellen
        pinInput.oninput = () => {
            if (pinInput.value.length === 4 && !submitted) {
                submitted = true;
                submitHandler(tabId, url);
            } else {
                pinError.style.display = 'none';
            }
        };
        // Submit-Handler
        function submitHandler(tabId = null, url = null) {
            const pin = pinInput.value;
            if (window.PinManager && window.PinManager.checkPin && window.PinManager.checkPin(pin)) {
                window.WhitelistManager.addToWhitelist(url);
                modal.style.display = 'none';
                window.uiManager.hideBlockedMessage(tabId);
                window.webviewManager.navigateToUrl(url);
                if (opts && opts.onSuccess) {
                    opts.onSuccess();
                }
            } else {
                pinError.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
                submitted = false;
            }
        }
        // Abbrechen-Button bleibt immer
        pinCancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
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
