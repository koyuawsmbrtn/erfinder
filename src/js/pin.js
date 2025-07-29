// PIN-Logik für Renderer und Main
class PinManager {
    static getPin() {
        return localStorage.getItem('parentalPin');
    }
    static setPin(pin) {
        localStorage.setItem('parentalPin', pin);
    }
    static checkPin(pin) {
        return PinManager.getPin() === pin;
    }
}
window.PinManager = PinManager;
