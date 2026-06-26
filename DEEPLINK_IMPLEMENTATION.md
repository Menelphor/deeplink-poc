# Deep Link Implementation für Lotterieservice App

## Übersicht

Diese Implementierung ermöglicht Deep Linking zur Lotterieservice App mit intelligenter Fallback-Logik für Fälle, in denen die App nicht installiert ist.

## Funktionsweise

### 1. Mobile-Erkennung
Der Handler prüft automatisch, ob der Nutzer ein mobiles Gerät verwendet. Nur auf mobilen Geräten wird die Deep-Linking-Logik aktiviert.

```javascript
if (!this.isMobileDevice()) {
    return; // Keine Verarbeitung auf Desktop
}
```

### 2. Deep Link Auslösung
Wenn ein Link mit der Domain `app.lotterieservice.de` von der Website `lotterieservice.de` aufgerufen wird, versucht der Handler die App zu öffnen:

- **iOS**: Nutzt Universal Links via `apple-app-site-association` (HTTPS URLs)
- **Android**: Nutzt App Links via `assetlinks.json` und Android Intent (HTTPS URLs)

### 3. Timeout & Fallback (100ms)
Nach ~100ms wird überprüft, ob die App geöffnet wurde. Falls nicht, wird ein Modal angezeigt:

```javascript
const fallbackTimer = setTimeout(() => {
    if (Date.now() - appAttemptTime >= this.APP_TIMEOUT_MS) {
        this.showModal(path); // Modal anzeigen
    }
}, this.APP_TIMEOUT_MS);
```

### 4. Modal mit Optionen
Das Modal bietet dem Nutzer drei Optionen:

1. **App herunterladen**: Leitet zum App Store / Play Store weiter
2. **Im Browser öffnen**: Öffnet die Browser-Version (lotterieservice.de)
3. **Nicht mehr anzeigen**: Speichert Preference im Cookie

### 5. Cookie-Speicherung
Die Benutzerentscheidung wird 30 Tage lang im Cookie gespeichert:

```javascript
// Beispiel Cookie-Einträge:
deeplink_preference=browser    // Nutzer bevorzugt Browser
deeplink_preference=app-store  // Nutzer hat App installiert
deeplink_preference=skip       // Nutzer möchte Modal nicht sehen
```

## Technische Details

### Browser-Kompatibilität
- iOS 9.0+ (Universal Links)
- Android 6.0+ (App Links)
- Fallback auf Standard HTTP/HTTPS Links

### User Agent Erkennung
```javascript
const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
```

### Deep Link Format

**iOS (Universal Links):**
```
https://app.lotterieservice.de/faq
https://app.lotterieservice.de/lotto6aus49/normalschein
```

**Android (App Links):**
```
https://app.lotterieservice.de/faq
https://app.lotterieservice.de/lotto6aus49/normalschein
```

**Beide Plattformen unterstützen auch:**
```
https://lotterieservice.de/faq
https://lotterieservice.de/lotto6aus49/normalschein
```

## Installation & Konfiguration

### 1. App Store URLs konfigurieren
In `app.js` die URLs anpassen:

```javascript
this.PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=de.lotterieservice.app';
this.APP_STORE_URL = 'https://apps.apple.com/de/app/lotterieservice/id123456789';
```

### 2. Apple App Site Association
Datei: `.well-known/apple-app-site-association` (JSON)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "XXXXXXXXXX.de.lotterieservice.app",
        "paths": ["/*"]
      }
    ]
  }
}
```

### 3. Android Asset Links
Datei: `.well-known/assetlinks.json` (JSON)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "de.lotterieservice.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:DD:..."]
    }
  }
]
```

## CSS Styling

Das Modal ist vollständig responsive und unterstützt:
- Mobile Geräte (320px - 768px)
- Tablets (768px - 1024px)
- Desktop (1024px+)

### Animationen
- **Modal Appearance**: Fade-in (0.3s)
- **Content**: Slide-up (0.3s)
- **Button Hover**: Lift-Effect mit Shadow

## Test-Szenarios

### Szenario 1: App installiert
1. Nutzer klickt auf `https://app.lotterieservice.de/faq` von `https://lotterieservice.de/faq`
2. App wird sofort geöffnet (< 100ms)
3. Kein Modal wird angezeigt
4. Cookie wird NICHT gesetzt

### Szenario 2: App nicht installiert
1. Nutzer klickt auf `https://app.lotterieservice.de/faq` von `https://lotterieservice.de/faq`
2. Nach ~100ms: App öffnet sich nicht
3. Modal wird angezeigt
4. Nutzer wählt Option:
   - **App herunterladen**: Redirect zu App Store
  - **Im Browser öffnen**: Redirect zu `lotterieservice.de/faq`
   - **Nicht mehr anzeigen**: Cookie `deeplink_preference=skip`

### Szenario 3: Cookie gesetzt
1. Nutzer hat bereits eine Entscheidung getroffen
2. Cookie `deeplink_preference=browser` ist vorhanden
3. Deep Link wird nicht verarbeitet, Nutzer bleibt auf Seite

### Szenario 4: Von Email aufgerufen
1. Link wird von Email-App aufgerufen (nicht von Webseite)
2. Modal kann nicht angezeigt werden (keine Kontrolle)
3. Falls App nicht vorhanden: Landingpage wird angezeigt

## Debug-Modus

Konsolen-Ausgaben für Debugging:

```javascript
console.log('Deeplink Handler initialized', {...});
console.log('Versuche Deeplink zu öffnen:', deeplink);
console.log('App hat nicht geöffnet, zeige Modal');
console.log(`Cookie gesetzt: ${name}=${value}`);
```

Browser DevTools öffnen (F12) und die Konsole überwachen.

## Security Considerations

1. **Cookie Security**: 
   - Nutzer kann Cookie jederzeit löschen
   - 30-Tage Ablauf garantiert Neubewertung

2. **URL Validation**: 
  - Nur `app.lotterieservice.de` triggert Deeplinks von `lotterieservice.de`
   - Andere Subdomains haben keine Auswirkung

3. **User Privacy**:
   - Keine Tracking oder Analytics ohne Nutzer-Zustimmung
   - Keine externe Daten werden gesammelt

## Fehlerbehandlung

| Fehler | Verhalten |
|--------|-----------|
| App nicht installiert | Modal wird angezeigt (nach 100ms) |
| Ungültiger Pfad | Kein Deeplink, Nutzer bleibt auf Seite |
| Cookie beschädigt | Nutzer wird nicht beinflusst, Fallback zu Modal |
| Offline | Browser-Fallback funktioniert nicht |

## Performance

- **Handler Init**: < 1ms
- **Deep Link Attempt**: Asynchron (100ms Timeout)
- **Modal Rendering**: < 50ms
- **Cookie Operations**: < 1ms

## Logging

Überprüfen Sie die Browser-Konsole mit `F12` → Console für Debug-Ausgaben:

```
Deeplink Handler initialized {path: "/faq", hostname: "app.lotterieservice.de", isMobile: true}
Versuche Deeplink zu öffnen: https://app.lotterieservice.de/faq
App hat nicht geöffnet, zeige Modal
Cookie gesetzt: deeplink_preference=browser
```
