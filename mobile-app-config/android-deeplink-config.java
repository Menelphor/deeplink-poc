// Android Deep Link Configuration
// Diese Konfiguration sollte in der Android App implementiert werden

// 1. AndroidManifest.xml - Intent Filter für App Links
/*
<activity
    android:name=".MainActivity"
    android:exported="true">
    
    <!-- App Links für app.lotterieservice.de -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Nur von app.lotterieservice.de -->
        <data
            android:scheme="https"
            android:host="app.lotterieservice.de"
            android:pathPrefix="/" />
    </intent-filter>
    
    <!-- Fallback Custom Scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <data
            android:scheme="lotterieservice"
            android:host="app"
            android:pathPrefix="/" />
    </intent-filter>
</activity>
*/

// 2. Deep Link Handler in der Activity
class DeepLinkActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Hole den Intent und die Daten
        Intent intent = getIntent();
        Uri deeplink = intent.getData();
        
        if (deeplink != null) {
            handleDeeplink(deeplink);
        }
    }
    
    private void handleDeeplink(Uri uri) {
        String path = uri.getPath();
        String host = uri.getHost();
        String scheme = uri.getScheme();
        
        // Beispiele:
        // https://app.lotterieservice.de/lotto6aus49/normalschein
        // lotterieservice://app/lotto6aus49/normalschein
        
        if ("app.lotterieservice.de".equals(host) || "app".equals(host)) {
            // Navigiere zum entsprechenden Fragment/Activity
            if (path != null) {
                if (path.contains("lotto6aus49")) {
                    navigateToLotto6aus49(path);
                } else if (path.contains("faq")) {
                    navigateToFAQ();
                } else if (path.contains("normalschein")) {
                    navigateToNormalschein(path);
                }
            }
        }
    }
    
    private void navigateToLotto6aus49(String path) {
        // Navigation zur Lotto 6 aus 49 Seite
    }
    
    private void navigateToFAQ() {
        // Navigation zur FAQ Seite
    }
    
    private void navigateToNormalschein(String path) {
        // Navigation zur Normalschein Seite
    }
}

// 3. Firebase Dynamic Links (optional)
class FirebaseDynamicLinksHandler {
    
    private void handleDynamicLink() {
        FirebaseDynamicLinks.getInstance()
            .getDynamicLink(getIntent())
            .addOnSuccessListener(this, pendingDynamicLinkData -> {
                Uri deepLink = null;
                if (pendingDynamicLinkData != null) {
                    deepLink = pendingDynamicLinkData.getLink();
                }
                
                if (deepLink != null) {
                    // Behandle den Deep Link
                    handleDeeplink(deepLink);
                }
            });
    }
}
