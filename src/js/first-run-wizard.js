/**
 * Erfinder Browser - First Run Wizard
 * Führt neue Benutzer durch die Einrichtung der Elternkontrolle
 */

class FirstRunWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.initialWhitelist = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Enter-Taste für PIN-Eingaben
        document.getElementById('new-pin').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirm-pin').focus();
            }
        });

        document.getElementById('confirm-pin').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.savePinAndNext();
            }
        });

        // Enter-Taste für Whitelist-Eingabe
        document.getElementById('whitelist-url').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addToInitialWhitelist();
            }
        });

        // Auto-Submit bei 4 Stellen PIN
        document.getElementById('new-pin').addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 4 && /^\d{4}$/.test(value)) {
                document.getElementById('confirm-pin').focus();
            }
        });

        document.getElementById('confirm-pin').addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 4 && /^\d{4}$/.test(value)) {
                // Kurz warten, dann automatisch validieren
                setTimeout(() => this.validatePins(), 100);
            }
        });
    }

    validatePins() {
        const newPin = document.getElementById('new-pin').value.trim();
        const confirmPin = document.getElementById('confirm-pin').value.trim();
        const errorDiv = document.getElementById('pin-error');

        errorDiv.classList.remove('show');

        if (!newPin || !confirmPin) {
            this.showError('pin-error', 'Bitte beide PIN-Felder ausfüllen!');
            return false;
        }

        if (!/^\d{4}$/.test(newPin)) {
            this.showError('pin-error', 'Die PIN muss genau 4 Ziffern enthalten!');
            return false;
        }

        if (newPin !== confirmPin) {
            this.showError('pin-error', 'Die PINs stimmen nicht überein!');
            document.getElementById('confirm-pin').value = '';
            document.getElementById('confirm-pin').focus();
            return false;
        }

        return true;
    }

    savePinAndNext() {
        if (this.validatePins()) {
            const pin = document.getElementById('new-pin').value;
            
            // PIN in localStorage speichern (gleiche Logik wie in parents.js)
            localStorage.setItem('parentalPin', String(pin).padStart(4, '0'));
            
            this.nextStep();
        }
    }

    addToInitialWhitelist() {
        const input = document.getElementById('whitelist-url');
        const errorDiv = document.getElementById('whitelist-error');
        let url = input.value.trim();

        errorDiv.classList.remove('show');

        if (!url) {
            this.showError('whitelist-error', 'Bitte eine URL eingeben!');
            return;
        }

        // URL-Validierung und -Normalisierung
        if (!/^https?:\/\//.test(url)) {
            url = 'https://' + url;
        }

        try {
            new URL(url); // Validierung
        } catch {
            this.showError('whitelist-error', 'Ungültige URL! Bitte korrekte URL eingeben.');
            return;
        }

        if (this.initialWhitelist.includes(url)) {
            this.showError('whitelist-error', 'Diese URL ist bereits in der Liste!');
            return;
        }

        this.initialWhitelist.push(url);
        this.renderInitialWhitelist();
        input.value = '';
        input.focus();
    }

    removeFromInitialWhitelist(url) {
        this.initialWhitelist = this.initialWhitelist.filter(u => u !== url);
        this.renderInitialWhitelist();
    }

    renderInitialWhitelist() {
        const list = document.getElementById('initial-whitelist');
        list.innerHTML = '';

        this.initialWhitelist.forEach(url => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${url}</span>
                <button onclick="wizard.removeFromInitialWhitelist('${url}')">Entfernen</button>
            `;
            list.appendChild(li);
        });
    }

    saveWhitelist() {
        if (this.initialWhitelist.length > 0) {
            // Whitelist in localStorage speichern (gleiche Logik wie in parents.js)
            localStorage.setItem('parentalWhitelist', JSON.stringify(this.initialWhitelist));
            return true;
        }
        return false;
    }

    skipWhitelistSetup() {
        // Leere Whitelist speichern
        localStorage.setItem('parentalWhitelist', JSON.stringify([]));
        this.completeSetup();
    }

    completeSetup() {
        const hasWhitelist = this.saveWhitelist();
        
        // Summary aktualisieren
        const whitelistSummary = document.getElementById('whitelist-summary');
        if (hasWhitelist) {
            whitelistSummary.textContent = `✅ ${this.initialWhitelist.length} Website(s) zur Whitelist hinzugefügt`;
        } else {
            whitelistSummary.textContent = '⚪ Keine Websites zur Whitelist hinzugefügt';
        }

        // Flag setzen, dass Setup abgeschlossen ist
        localStorage.setItem('firstRunCompleted', 'true');
        
        this.nextStep();
    }

    startBrowser() {
        // Wizard-Fenster schließen
        if (window.opener) {
            // Hauptfenster neu laden um neue Einstellungen zu übernehmen
            window.opener.location.reload();
        }
        
        // Signal an Main Process senden, dass Setup abgeschlossen ist
        if (typeof require !== 'undefined') {
            try {
                const { ipcRenderer } = require('electron');
                ipcRenderer.send('first-run-completed');
            } catch (error) {
                console.log('Could not send completion signal:', error);
            }
        }
        
        window.close();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.hideCurrentStep();
            this.currentStep++;
            this.showCurrentStep();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.hideCurrentStep();
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    hideCurrentStep() {
        const currentStepElement = document.querySelector('.wizard-step.active');
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
    }

    showCurrentStep() {
        const stepIds = ['step-welcome', 'step-pin-setup', 'step-whitelist-setup', 'step-complete'];
        const stepElement = document.getElementById(stepIds[this.currentStep - 1]);
        if (stepElement) {
            stepElement.classList.add('active');
        }

        // Step Indicator aktualisieren
        const stepIndicator = document.getElementById('step-indicator');
        if (stepIndicator) {
            stepIndicator.textContent = `Schritt ${this.currentStep} von ${this.totalSteps}`;
        }

        // Fokus für relevante Eingabefelder setzen
        setTimeout(() => {
            if (this.currentStep === 2) {
                document.getElementById('new-pin').focus();
            } else if (this.currentStep === 3) {
                document.getElementById('whitelist-url').focus();
            }
        }, 100);
    }

    showError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
}

// Global functions für onclick handlers
function nextStep() {
    wizard.nextStep();
}

function previousStep() {
    wizard.previousStep();
}

function savePinAndNext() {
    wizard.savePinAndNext();
}

function addToInitialWhitelist() {
    wizard.addToInitialWhitelist();
}

function skipWhitelistSetup() {
    wizard.skipWhitelistSetup();
}

function completeSetup() {
    wizard.completeSetup();
}

function startBrowser() {
    wizard.startBrowser();
}

// Wizard initialisieren
const wizard = new FirstRunWizard();

// Debug: Reset für Entwicklung (kann später entfernt werden)
if (new URLSearchParams(window.location.search).has('reset')) {
    localStorage.removeItem('firstRunCompleted');
    localStorage.removeItem('parentalPin');
    localStorage.removeItem('parentalWhitelist');
    console.log('First run data reset for development');
}
