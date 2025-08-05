// ...existing code...
document.getElementById('pin-input').oninput = function() {
    const val = this.value.trim();
    if (/^\d{4}$/.test(val)) {
        document.getElementById('pin-check').click();
    }
};
// Elternbereich-Logik
function getPin() {
    // Immer als String zurückgeben
    return (localStorage.getItem('parentalPin') || '').trim();
}

function isFirstRun() {
    const firstRunCompleted = localStorage.getItem('firstRunCompleted');
    const parentalPin = localStorage.getItem('parentalPin');
    return !firstRunCompleted || !parentalPin;
}

function setPin(pin) {
    localStorage.setItem('parentalPin', String(pin).padStart(4, '0'));
}
function getWhitelist() {
    try {
        const wl = localStorage.getItem('parentalWhitelist');
        return wl ? JSON.parse(wl) : [];
    } catch {
        return [];
    }
}
function setWhitelist(list) {
    localStorage.setItem('parentalWhitelist', JSON.stringify(list));
}
function removeFromWhitelist(url) {
    const wl = getWhitelist().filter(u => u !== url);
    setWhitelist(wl);
    renderWhitelist();
}
function addToWhitelist(url) {
    const wl = getWhitelist();
    if (!wl.includes(url)) {
        wl.push(url);
        setWhitelist(wl);
        renderWhitelist();
        
        // Show brief success feedback
        const input = document.getElementById('whitelist-add');
        const originalPlaceholder = input.placeholder;
        input.placeholder = '✅ Website hinzugefügt!';
        input.style.borderColor = '#28a745';
        setTimeout(() => {
            input.placeholder = originalPlaceholder;
            input.style.borderColor = '#e1e5e9';
        }, 2000);
    } else {
        const error = document.getElementById('whitelist-error');
        error.textContent = 'Diese Website ist bereits in der Whitelist!';
        error.classList.add('show');
    }
}
function renderWhitelist() {
    const list = getWhitelist();
    const ul = document.getElementById('whitelist-list');
    ul.innerHTML = '';
    
    if (list.length === 0) {
        const li = document.createElement('li');
        li.style.color = '#999';
        li.style.fontStyle = 'italic';
        li.style.justifyContent = 'center';
        li.textContent = 'Keine Websites in der Whitelist';
        ul.appendChild(li);
        return;
    }
    
    list.forEach(url => {
        const li = document.createElement('li');
        
        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        urlSpan.style.wordBreak = 'break-all';
        
        const btn = document.createElement('button');
        btn.textContent = 'Entfernen';
        btn.onclick = () => {
            if (confirm(`Website "${url}" aus der Whitelist entfernen?`)) {
                removeFromWhitelist(url);
            }
        };
        
        li.appendChild(urlSpan);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}
document.getElementById('pin-check').onclick = function() {
    const pinInput = (document.getElementById('pin-input').value || '').trim();
    const error = document.getElementById('pin-error');
    
    // Reset error state
    error.textContent = '';
    error.classList.remove('show');
    
    if (/^\d{4}$/.test(pinInput)) {
        if (getPin() === pinInput) {
            // Hide PIN step and show main step with smooth transition
            document.getElementById('step-pin').classList.remove('active');
            document.getElementById('step-main').classList.add('active');
            renderWhitelist();
        } else {
            error.textContent = 'Falsche PIN! Bitte versuchen Sie es erneut.';
            error.classList.add('show');
            document.getElementById('pin-input').value = '';
            document.getElementById('pin-input').focus();
        }
    } else {
        error.textContent = 'Bitte eine 4-stellige Zahl eingeben!';
        error.classList.add('show');
        document.getElementById('pin-input').focus();
    }
};
document.getElementById('pin-save').onclick = function() {
    const pinNew = (document.getElementById('pin-new').value || '').trim();
    const error = document.getElementById('pin-new-error');
    const success = document.getElementById('success-msg');
    
    // Reset messages
    error.textContent = '';
    error.classList.remove('show');
    success.textContent = '';
    
    if (/^\d{4}$/.test(pinNew)) {
        setPin(pinNew);
        success.textContent = 'PIN erfolgreich geändert! 🎉';
        success.style.display = 'block';
        document.getElementById('pin-new').value = '';
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            success.style.display = 'none';
        }, 3000);
    } else {
        error.textContent = 'Bitte eine 4-stellige Zahl eingeben!';
        error.classList.add('show');
        document.getElementById('pin-new').focus();
    }
};
document.getElementById('whitelist-add-btn').onclick = function() {
    const input = document.getElementById('whitelist-add');
    const error = document.getElementById('whitelist-error');
    let url = (input.value || '').trim();
    
    // Reset error state
    error.textContent = '';
    error.classList.remove('show');
    
    if (!url) {
        error.textContent = 'Bitte eine URL eingeben!';
        error.classList.add('show');
        input.focus();
        return;
    }
    
    // Einfache URL-Validierung
    if (!/^https?:\/+/.test(url)) {
        url = 'https://' + url;
    }
    
    try {
        new URL(url); // URL-Validierung
        addToWhitelist(url);
        input.value = '';
        input.focus();
    } catch {
        error.textContent = 'Ungültige URL! Bitte eine gültige Webadresse eingeben.';
        error.classList.add('show');
        input.focus();
    }
};
// Enter auf #whitelist-add triggert Hinzufügen-Button
const whitelistAddInput = document.getElementById('whitelist-add');
const whitelistAddBtn = document.getElementById('whitelist-add-btn');
if (whitelistAddInput && whitelistAddBtn) {
    whitelistAddInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            whitelistAddBtn.click();
        }
    });
}
// ...existing code...

// Erstkonfiguration prüfen beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    if (isFirstRun()) {
        // Nachricht anzeigen und zum Wizard weiterleiten
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: 'Segoe UI', sans-serif;">
                <h2>🔧 Erstkonfiguration erforderlich</h2>
                <p>Es scheint, als wäre dies Ihr erster Besuch im Elternbereich.</p>
                <p>Bitte schließen Sie dieses Fenster und starten Sie Erfinder neu, um die Einrichtung zu beginnen.</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px;">Fenster schließen</button>
            </div>
        `;
        return;
    }
    
    // Normale Initialisierung nur wenn PIN bereits gesetzt ist
    renderWhitelist();
});
