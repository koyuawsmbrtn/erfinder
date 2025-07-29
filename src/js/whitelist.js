// Whitelist-Logik für Renderer und Main
class WhitelistManager {
    static getWhitelist() {
        const wl = localStorage.getItem('parentalWhitelist');
        return wl ? JSON.parse(wl) : [];
    }
    static addToWhitelist(url) {
        let wl = WhitelistManager.getWhitelist();
        if (!wl.includes(url)) {
            wl.push(url);
            localStorage.setItem('parentalWhitelist', JSON.stringify(wl));
        }
    }
    static removeFromWhitelist(url) {
        let wl = WhitelistManager.getWhitelist();
        wl = wl.filter(u => u !== url);
        localStorage.setItem('parentalWhitelist', JSON.stringify(wl));
    }
    static isWhitelisted(url) {
        return WhitelistManager.getWhitelist().includes(url);
    }
}
window.WhitelistManager = WhitelistManager;
