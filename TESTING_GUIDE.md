# Deep Link Testing Guide

## Voraussetzungen

- Mobiles Gerät (iOS oder Android) oder Browser-Emulator
- Localhost-Server läuft (`npm start`)
- DNS-Einträge für Test-Domain sind konfiguriert

## Setup für lokales Testing

### 1. Hosts-Datei konfigurieren

**macOS/Linux:**
```bash
sudo nano /etc/hosts
```

**Windows:**
```
C:\Windows\System32\drivers\etc\hosts
```

Füge folgende Einträge hinzu:
```
127.0.0.1 app.lotterieservice.de
127.0.0.1 lotterieservice.de
```

### 2. Server starten

```bash
npm install
npm start
```

Server läuft dann auf: `http://localhost:8080`

### 3. Im Browser öffnen

- **Desktop**: `http://app.lotterieservice.de:8080`
- **Mobil**: `http://192.168.x.x:8080` (Local IP-Adresse)

---

## Test-Szenarios

### Test 1: Mobile Erkennung

**Ziel**: Verifiziere, dass nur mobiles Geräte den Handler aktivieren

**Schritte:**
1. Öffne die Website auf Desktop-Browser
2. Konsole öffnen (F12)
3. Überprüfe, dass keine Deeplink-Logs erscheinen

**Ergebnis:** ✅ Kein "Deeplink Handler initialized" Log

**Code zum Testen:**
```javascript
// In Browser-Konsole:
handler = new DeeplinkHandler();
console.log(handler.isMobileDevice()); // sollte false sein
```

---

### Test 2: Deeplink Versuch (mit Desktop emulieren)

**Ziel**: Teste Deeplink-Logik mit Mobile-Emulator

**Schritte:**
1. Browser DevTools öffnen (F12)
2. Device Toolbar aktivieren (Ctrl+Shift+M / Cmd+Shift+M)
3. Auf "Lotto 6 aus 49" Link klicken: `https://app.lotterieservice.de/lotto6aus49/normalschein`
4. Konsole beobachten

**Ergebnis:** ✅ Logs sollten erscheinen:
```
Deeplink Handler initialized {path: "/lotto6aus49/normalschein", hostname: "app.lotterieservice.de", isMobile: true}
Versuche Deeplink zu öffnen: lotterieservice:///lotto6aus49/normalschein
App hat nicht geöffnet, zeige Modal
```

---

### Test 3: Modal Anzeige

**Ziel**: Verifiziere dass Modal korrekt angezeigt wird

**Schritte:**
1. Mobile-Emulator aktivieren
2. Auf App-Link klicken
3. Nach ~100ms sollte Modal erscheinen

**Überprüfung:**
```javascript
// In Browser-Konsole:
document.getElementById('deeplink-modal').style.display // sollte 'flex' sein
```

**Ergebnis:** ✅ Modal wird angezeigt mit 3 Buttons

---

### Test 4: Download App Button

**Ziel**: Teste Weiterleitung zu App Store

**Schritte:**
1. Modal wird angezeigt
2. Klicke "App herunterladen" Button
3. Beobachte redirect

**Ergebnis:** ✅ 
- Redirect zu App Store URL (iOS) oder Play Store (Android)
- Cookie wird gesetzt: `deeplink_preference=app-store`

**Cookie überprüfen:**
```javascript
// In Browser-Konsole:
document.cookie // sollte enthalten: deeplink_preference=app-store
```

---

### Test 5: Im Browser öffnen Button

**Ziel**: Teste Fallback zur Browser-Version

**Schritte:**
1. Modal ist angezeigt
2. Klicke "Im Browser öffnen" Button
3. Beobachte redirect

**Ergebnis:** ✅
- Redirect zu `https://lotterieservice.de/lotto6aus49/normalschein`
- Cookie wird gesetzt: `deeplink_preference=browser`

```javascript
// Überprüfe Cookie:
document.cookie
```

---

### Test 6: Nicht mehr anzeigen Button

**Ziel**: Teste Cookie-Speicherung für "Skip"

**Schritte:**
1. Modal ist angezeigt
2. Klicke "Nicht mehr anzeigen" Button
3. Modal sollte sich schließen
4. Lade Seite neu
5. Modal sollte NICHT mehr angezeigt werden

**Überprüfung:**
```javascript
// Cookie Wert:
document.cookie
// sollte enthalten: deeplink_preference=skip

// Nach Seitenneuladen sollte Modal nicht erscheinen
```

**Ergebnis:** ✅ Modal wird nur einmal angezeigt (wenn Cookie nicht existiert)

---

### Test 7: Cookie-Präferenz beachten

**Ziel**: Verifiziere dass Cookies respektiert werden

**Schritte:**
1. Cookie setzen mit: `deeplink_preference=browser`
2. Lade App-Link neu
3. Modal sollte NICHT angezeigt werden
4. Nutzer sollte auf Seite bleiben

**Cookie manuell setzen:**
```javascript
// In Browser-Konsole:
document.cookie = "deeplink_preference=browser; expires=Fri, 31 Dec 2025 23:59:59 GMT; path=/";

// Seitenneuladen → Modal sollte nicht erscheinen
location.reload();
```

**Ergebnis:** ✅ Deep Link wird nicht verarbeitet, wenn Preference existiert

---

### Test 8: Cross-Origin Verhalten

**Ziel**: Teste dass Deep Links von anderen Domains nicht verarbeitet werden

**Schritte:**
1. Öffne Link von `https://lotterieservice.de` (nicht app.lotterieservice.de)
2. Deep Link sollte NICHT aktiviert werden
3. Nutzer sollte auf Seite bleiben

**Ergebnis:** ✅ Nur `app.lotterieservice.de` Subdomäne triggert Deeplinks

---

## Browser-Konsole Debugging

### Logs überprüfen
```javascript
// F12 → Console Tab öffnen und Logs beobachten
```

### Cookies anzeigen
```javascript
// Alle Cookies:
console.log(document.cookie);

// Spezifischen Cookie lesen:
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

console.log(getCookie('deeplink_preference'));
```

### Cookies löschen
```javascript
// Alle Cookies löschen:
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
});

// Oder spezifischen Cookie löschen:
document.cookie = "deeplink_preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
```

### Modal manuell anzeigen
```javascript
// Modal forciert anzeigen (für Testing):
const modal = document.getElementById('deeplink-modal');
if (!modal) {
    const handler = new DeeplinkHandler();
    handler.showModal('/test-path');
}
```

### Handler State überprüfen
```javascript
// Handler initialisieren und Properties prüfen:
const handler = new DeeplinkHandler();
console.log({
    isMobile: handler.isMobileDevice(),
    isIOS: handler.isIOS(),
    isAndroid: handler.isAndroid(),
    timeout: handler.APP_TIMEOUT_MS
});
```

---

## Reale Geräte-Testing

### iOS Device

**Anforderung:**
- Testflug App zum manuellen Deep Linking
- X-Callback-URL Support

**Schritte:**
1. Deep Link in Safari öffnen: `https://app.lotterieservice.de/faq`
2. Beobachte ob App öffnet oder Modal angezeigt wird

### Android Device

**Anforderung:**
- App Links Support (Android 6.0+)
- Chrome Browser

**Schritte:**
1. Deep Link in Chrome öffnen: `https://app.lotterieservice.de/faq`
2. Beobachte ob App öffnet oder Modal angezeigt wird

---

## Performance Testing

### Timeout Überprüfung
```javascript
// Messe wie lange Deep Link Versuch dauert:
const start = performance.now();
handler.handleDeeplink('/faq');
setTimeout(() => {
    const duration = performance.now() - start;
    console.log(`Deeplink versuch dauerte: ${duration}ms`);
}, 150);
```

### Memory Leaks überprüfen
```javascript
// In Chrome DevTools:
1. F12 → Memory Tab
2. Heap Snapshot erstellen
3. Handler mehrmals initialisieren
4. Zweiten Snapshot erstellen
5. Vergleiche auf neue Objects
```

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Localhost DNS funktioniert nicht | Hosts-Datei aktualisieren und Cache löschen |
| Modal erscheint nicht | DevTools öffnen, Cookies löschen, Seite neu laden |
| Deeplink Logs nicht sichtbar | Mobile-Emulator aktivieren (F12 → Device Toolbar) |
| Cookie wird nicht gespeichert | Prüfe Cookies sind aktiviert in Browser-Einstellungen |
| App öffnet nicht (real device) | apple-app-site-association / assetlinks.json prüfen |

---

## Checkliste für Produktion

- [ ] Deeplink Handler auf mobilen Geräten getestet
- [ ] Modal wird nach ~100ms angezeigt
- [ ] Cookie wird für 30 Tage gespeichert
- [ ] Alle 3 Button-Funktionen getestet
- [ ] App Store URLs für iOS/Android konfiguriert
- [ ] apple-app-site-association auf Server deployed
- [ ] assetlinks.json auf Server deployed
- [ ] Cross-Browser Testing durchgeführt
- [ ] Performance Tests bestanden
- [ ] Fehlerbehandlung getestet
