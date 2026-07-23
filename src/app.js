/**
 * Deeplink Handler für Lotterieservice App
 * Verwaltet die Weiterleitung zur mobilen App mit Fallback zu App Stores
 */

class DeeplinkHandler {
    constructor() {
        this.COOKIE_NAME = 'deeplink_preference';
        this.COOKIE_EXPIRATION_DAYS = 30;
        this.PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=de.lottobw.app'; // Beispiel
        this.APP_STORE_URL = 'https://apps.apple.com/de/app/lotto-baden-w%C3%BCrttemberg/id903035939'; // Beispiel
        this.MODAL_ID = 'deeplink-modal';
    }

    /**
     * Sendet einen Log-Eintrag an die Vercel-Funktion /api/log
     */
    sendLog(event, data = {}, level = 'info') {
        try {
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, event, data }),
                keepalive: true,
            }).catch(() => { /* Logging-Fehler nie nach außen werfen */ });
        } catch (_) { /* ignore */ }
    }

    /**
     * Initialisiert den Deeplink Handler
     */
    init() {
        // Überprüfe die Seiten-URL
        const currentPath = window.location.pathname;
        const currentHostname = window.location.hostname;
        const isLocalDebugHost = this.isLocalDebugHost();
        const isAppLandingHost = currentHostname === 'app.lotterieservice.de' || isLocalDebugHost;
        const isWebsiteHost = currentHostname === 'lotterieservice.de';

        // .well-known Pfade niemals weiterleiten
        if (currentPath.startsWith('/.well-known')) {
            return;
        }

        if (!isAppLandingHost && !isWebsiteHost) {
            console.log('Deeplink Handler: Domain ist kein Deeplink Trigger', currentHostname);
            this.sendLog('init.domain_skip', { hostname: currentHostname });
            return;
        }

        if (currentPath === '/') {
            return;
        }

        if (!this.isMobileDevice() && !isLocalDebugHost) {
            if (!isAppLandingHost) {
                return;
            }

            console.log('Desktop redirect to lotterieservice.de', currentPath);
            this.sendLog('init.desktop_redirect', { path: currentPath });
            window.location.href = `https://lotterieservice.de${currentPath}`;
            return;
        }

        if (!isAppLandingHost) {
            this.sendLog('init.source_page', { path: currentPath, hostname: currentHostname });
            return;
        }

        // Debug-Informationen
        console.log('Deeplink Handler initialized', {
            path: currentPath,
            hostname: currentHostname,
            isMobile: true
        });
        this.sendLog('init.mobile_landing', { path: currentPath, hostname: currentHostname });

        // Wenn diese Seite geladen wurde, hat die App den Universal Link nicht übernommen.
        this.handleBrowserFallback(currentPath);
    }

    /**
     * Prüft, ob es ein mobiles Gerät ist
     */
    isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        return mobileRegex.test(userAgent.toLowerCase());
    }

    /**
     * Prüft, ob iOS Gerät
     */
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * Prüft, ob Android Gerät
     */
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    /**
     * Prüft, ob wir auf einem lokalen Debug-Host laufen
     */
    isLocalDebugHost() {
        const currentHostname = window.location.hostname;
        return currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    }

    /**
     * Hauptfunktion zur Behandlung des Deeplinks
     */
    handleBrowserFallback(path) {
        // Überprüfe ob der Nutzer bereits eine Entscheidung getroffen hat
        const preference = this.getCookie(this.COOKIE_NAME);
        
        if (preference === 'browser') {
            // Nutzer möchte Browser verwenden → direkt zur Browser-Version weiterleiten
            console.log('User preference: browser');
            this.sendLog('deeplink.preference', { preference: 'browser', path });
            window.location.href = `https://lotterieservice.de${path}`;
            return;
        }

        if (preference === 'skip') {
            // Nutzer hat Modal ignoriert/geschlossen → zur Browser-Version weiterleiten
            console.log('User preference: skip modal');
            this.sendLog('deeplink.preference', { preference: 'skip', path });
            window.location.href = `https://lotterieservice.de${path}`;
            return;
        }

        this.sendLog('deeplink.browser_landing', { path }, 'warn');
        this.showModal(path);
    }

    /**
     * Zeigt das Modal mit Optionen
     */
    showModal(path) {
        // Überprüfe ob Modal bereits existiert
        let modal = document.getElementById(this.MODAL_ID);
        
        if (!modal) {
            modal = this.createModal(path);
            document.body.appendChild(modal);
        }

        // Zeige das Modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Verhindere Scrollen
    }

    /**
     * Erstellt das Modal-Element
     */
    createModal(path) {
        const modal = document.createElement('div');
        modal.id = this.MODAL_ID;
        modal.className = 'deeplink-modal';

        const content = document.createElement('div');
        content.className = 'deeplink-modal-content';

        // Titel
        const title = document.createElement('h2');
        title.textContent = 'Lotterieservice App';
        content.appendChild(title);

        // Beschreibung
        const description = document.createElement('p');
        description.textContent = 'Verwenden Sie die Lotterieservice App für ein besseres Erlebnis.';
        content.appendChild(description);

        // Button Container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'deeplink-modal-buttons';

        // Download App Button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'deeplink-btn deeplink-btn-primary';
        downloadBtn.textContent = 'App herunterladen';
        downloadBtn.addEventListener('click', () => this.handleDownloadApp());
        buttonContainer.appendChild(downloadBtn);

        // Im Browser öffnen Button
        const browserBtn = document.createElement('button');
        browserBtn.className = 'deeplink-btn deeplink-btn-secondary';
        browserBtn.textContent = 'Im Browser öffnen';
        browserBtn.addEventListener('click', () => this.handleBrowserOpen(path));
        buttonContainer.appendChild(browserBtn);

        // Nicht mehr anzeigen Button
        const skipBtn = document.createElement('button');
        skipBtn.className = 'deeplink-btn deeplink-btn-tertiary';
        skipBtn.textContent = 'Nicht mehr anzeigen';
        skipBtn.addEventListener('click', () => this.handleSkip());
        buttonContainer.appendChild(skipBtn);

        content.appendChild(buttonContainer);

        // Schließen Button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'deeplink-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.closeModal());
        content.appendChild(closeBtn);

        modal.appendChild(content);

        // Schließe Modal bei Klick außerhalb
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        return modal;
    }

    /**
     * Schließt das Modal
     */
    closeModal() {
        const modal = document.getElementById(this.MODAL_ID);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Handler für Download App Button
     */
    handleDownloadApp() {
        // Speichere Entscheidung
        this.setCookie(this.COOKIE_NAME, 'app-store', this.COOKIE_EXPIRATION_DAYS);
        this.sendLog('modal.download_app', { platform: this.isIOS() ? 'ios' : 'android' });
        
        // Leite zu App Store weiter
        if (this.isIOS()) {
            window.location.href = this.APP_STORE_URL;
        } else {
            window.location.href = this.PLAY_STORE_URL;
        }
        
        this.closeModal();
    }

    /**
     * Handler für Im Browser öffnen Button
     */
    handleBrowserOpen(path) {
        // Speichere Entscheidung
        this.setCookie(this.COOKIE_NAME, 'browser', this.COOKIE_EXPIRATION_DAYS);
        this.sendLog('modal.browser_open', { path });
        
        // Lade die Browser-Version der Seite
        window.location.href = `https://lotterieservice.de${path}`;
        
        this.closeModal();
    }

    /**
     * Handler für Nicht mehr anzeigen Button
     */
    handleSkip() {
        // Speichere Entscheidung
        this.setCookie(this.COOKIE_NAME, 'skip', this.COOKIE_EXPIRATION_DAYS);
        this.sendLog('modal.skip');
        
        this.closeModal();
    }

    /**
     * Setzt ein Cookie
     */
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
        console.log(`Cookie gesetzt: ${name}=${value}`);
    }

    /**
     * Liest ein Cookie
     */
    getCookie(name) {
        const nameEQ = `${name}=`;
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return cookie.substring(nameEQ.length);
            }
        }
        return null;
    }
}

// Initialisiere Handler wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    const handler = new DeeplinkHandler();
    handler.init();
});
