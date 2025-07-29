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
    }
}
function renderWhitelist() {
    const list = getWhitelist();
    const ul = document.getElementById('whitelist-list');
    ul.innerHTML = '';
    list.forEach(url => {
        const li = document.createElement('li');
        li.textContent = url;
        const btn = document.createElement('button');
        btn.textContent = 'Entfernen';
        btn.onclick = () => removeFromWhitelist(url);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}
document.getElementById('pin-check').onclick = function() {
    const pinInput = (document.getElementById('pin-input').value || '').trim();
    const error = document.getElementById('pin-error');
    if (/^\d{4}$/.test(pinInput)) {
        if (getPin() === pinInput) {
            document.getElementById('step-pin').style.display = 'none';
            document.getElementById('step-main').style.display = 'block';
            renderWhitelist();
        } else {
            error.textContent = 'Falsche PIN!';
        }
    } else {
        error.textContent = 'Bitte eine 4-stellige Zahl eingeben!';
    }
};
document.getElementById('pin-save').onclick = function() {
    const pinNew = (document.getElementById('pin-new').value || '').trim();
    const error = document.getElementById('pin-new-error');
    if (/^\d{4}$/.test(pinNew)) {
        setPin(pinNew);
        document.getElementById('success-msg').textContent = 'PIN erfolgreich geändert!';
        document.getElementById('success-msg').style.display = 'block';
    } else {
        error.textContent = 'Bitte eine 4-stellige Zahl eingeben!';
    }
};
document.getElementById('whitelist-add-btn').onclick = function() {
    const input = document.getElementById('whitelist-add');
    const error = document.getElementById('whitelist-error');
    let url = (input.value || '').trim();
    if (!url) {
        error.textContent = 'Bitte eine URL eingeben!';
        return;
    }
    // Einfache URL-Validierung
    if (!/^https?:\/\//.test(url)) {
        url = 'https://' + url;
    }
    addToWhitelist(url);
    input.value = '';
    error.textContent = '';
};
