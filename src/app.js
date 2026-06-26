/**
 * Deeplink Handler für Lotterieservice App
 * Verwaltet die Weiterleitung zur mobilen App mit Fallback zu App Stores
 */

class DeeplinkHandler {
    constructor() {
        this.COOKIE_NAME = 'deeplink_preference';
        this.COOKIE_EXPIRATION_DAYS = 30;
        this.APP_TIMEOUT_MS = 100; // Timeout für App-Weiterleitung
        this.PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=de.tagesschau.mobilnewsapp'; // Beispiel
        this.APP_STORE_URL = 'https://apps.apple.com/de/app/tagesschau/id326307276'; // Beispiel
        this.MODAL_ID = 'deeplink-modal';
        this.isDeferringOpen = false;
    }

    /**
     * Initialisiert den Deeplink Handler
     */
    init() {
        // Nur auf mobilen Geräten und wenn von der Website aufgerufen
        if (!this.isMobileDevice() && !this.isLocalDebugHost()) {
            return;
        }

        // Überprüfe die Seiten-URL
        const currentPath = window.location.pathname;
        const currentHostname = window.location.hostname;
        
        // Überprüfe ob die URL ein Deeplink Trigger ist
        // Unterstützt: app.lotterieservice.de als Deeplink-Ziel und lotterieservice.de als Quellseite
        // Für lokales Debugging sind localhost und 127.0.0.1 ebenfalls erlaubt.
        const isDeeplinkDomain = currentHostname === 'app.lotterieservice.de' || 
                 currentHostname === 'lotterieservice.de' ||
                 currentHostname === 'localhost' ||
                 currentHostname === '127.0.0.1';
        
        this.setupLinkHandlers();

        if (!isDeeplinkDomain) {
            console.log('Deeplink Handler: Domain ist kein Deeplink Trigger', currentHostname);
            return;
        }

        if (currentPath === '/') {
            return;
        }

        // Debug-Informationen
        console.log('Deeplink Handler initialized', {
            path: currentPath,
            hostname: currentHostname,
            isMobile: true
        });

        // Versuche den Deeplink zu öffnen
        this.handleDeeplink(currentPath);
    }

    /**
     * Registriert Klick-Handler für Deeplink-Links
     */
    setupLinkHandlers() {
        document.addEventListener('click', (event) => {
            const anchor = event.target.closest('a');

            if (!anchor || !anchor.href) {
                return;
            }

            const url = new URL(anchor.href, window.location.href);
            const isAppLink = url.hostname === 'app.lotterieservice.de';

            if (!isAppLink) {
                return;
            }

            event.preventDefault();
            this.handleDeeplink(url.pathname);
        });
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
    handleDeeplink(path) {
        // Überprüfe ob der Nutzer bereits eine Entscheidung getroffen hat
        const preference = this.getCookie(this.COOKIE_NAME);
        
        if (preference === 'browser') {
            // Nutzer möchte Browser verwenden
            console.log('User preference: browser');
            return;
        }

        if (preference === 'skip') {
            // Nutzer hat Modal ignoriert/geschlossen
            console.log('User preference: skip modal');
            return;
        }

        // Versuche App zu öffnen
        this.attemptAppDeeplink(path);
    }

    /**
     * Versucht die App zu öffnen
     */
    attemptAppDeeplink(path) {
        const deeplink = this.buildDeeplink(path);
        
        if (!deeplink) {
            console.log('Keine Deeplink möglich für Pfad:', path);
            return;
        }

        console.log('Versuche Deeplink zu öffnen:', deeplink);

        // Speichere den ursprünglichen Fokus
        const appAttemptTime = Date.now();
        
        // Setze ein Timer für den Fallback
        const fallbackTimer = setTimeout(() => {
            // Überprüfe ob App tatsächlich nicht geöffnet wurde
            if (Date.now() - appAttemptTime >= this.APP_TIMEOUT_MS) {
                console.log('App hat nicht geöffnet, zeige Modal');
                this.showModal(path);
            }
        }, this.APP_TIMEOUT_MS);

        // Versuche Deeplink zu öffnen
        if (this.isIOS()) {
            this.openIOSDeeplink(deeplink, fallbackTimer);
        } else if (this.isAndroid()) {
            this.openAndroidDeeplink(deeplink, fallbackTimer);
        }
    }

    /**
     * Öffnet Deeplink auf iOS
     */
    openIOSDeeplink(deeplink, fallbackTimer) {
        // Nutze Universal Links (wird durch apple-app-site-association definiert)
        window.location.href = deeplink;
    }

    /**
     * Öffnet Deeplink auf Android
     */
    openAndroidDeeplink(deeplink, fallbackTimer) {
        // Versuche Intent-URL für Android
        const intent = this.buildAndroidIntent(deeplink);
        
        try {
            // Versuche Intent zu öffnen
            window.location.href = intent;
        } catch (e) {
            console.log('Intent fehlgeschlagen, versuche Standard-Deeplink');
            window.location.href = deeplink;
        }
    }

    /**
     * Erstellt einen Android Intent
     */
    buildAndroidIntent(deeplink) {
        // Android Intent Format
        return `intent://${deeplink.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=de.lotterieservice;end`;
    }

    /**
     * Erstellt den Deeplink aus dem aktuellen Pfad
     */
    buildDeeplink(path) {
        // Der Deeplink wird über app.lotterieservice.de geöffnet
        const deeplink = 'https://app.lotterieservice.de';
        
        // Entferne führenden Slash
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        if (!cleanPath || cleanPath === '/') {
            return null; // Keine Deeplink für Root-Pfad
        }

        return `${deeplink}/${cleanPath}`;
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
