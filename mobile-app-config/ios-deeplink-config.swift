// iOS Deep Link Configuration
// Diese Konfiguration sollte in der iOS App implementiert werden

// 1. Info.plist - URL Scheme Registration
/*
<dict>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>lotterieservice</string>
            </array>
            <key>CFBundleURLName</key>
            <string>de.lotterieservice.app</string>
        </dict>
    </array>
</dict>
*/

// 2. Associated Domains für Universal Links
/*
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.lotterieservice.de</string>
        <string>applinks:lotterieservice.de</string>
    </array>
</dict>
*/

import UIKit

// 3. App Delegate - Deep Link Handling
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        // Handle custom URL scheme (lotterieservice://)
        handleDeeplink(url)
        return true
    }
    
    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        // Handle Universal Links (app.lotterieservice.de)
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            handleDeeplink(url)
        }
        return true
    }
    
    private func handleDeeplink(_ url: URL) {
        let path = url.path
        let host = url.host
        
        // Beispiele:
        // https://app.lotterieservice.de/lotto6aus49/normalschein
        // lotterieservice:///lotto6aus49/normalschein
        
        print("Handling deeplink: \(url)")
        print("Host: \(host ?? "")")
        print("Path: \(path)")
        
        // Navigiere basierend auf dem Pfad
        if path.contains("lotto6aus49") {
            navigateToLotto6aus49(path: path)
        } else if path.contains("faq") {
            navigateToFAQ()
        } else if path.contains("normalschein") {
            navigateToNormalschein(path: path)
        }
    }
    
    private func navigateToLotto6aus49(path: String) {
        // Navigation zur Lotto 6 aus 49 Seite
        if let rootViewController = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first?.windows
            .first?.rootViewController {
            // Navigiere zur Seite
        }
    }
    
    private func navigateToFAQ() {
        // Navigation zur FAQ Seite
    }
    
    private func navigateToNormalschein(path: String) {
        // Navigation zur Normalschein Seite
    }
}

// 4. Hilfsklasse für Deep Link Verarbeitung
class DeepLinkRouter {
    
    static let shared = DeepLinkRouter()
    
    enum DeepLinkType {
        case lotto6aus49(page: String?)
        case faq
        case normalschein(page: String?)
        case unknown
    }
    
    func parseDeeplink(_ url: URL) -> DeepLinkType {
        let path = url.path
        
        if path.contains("lotto6aus49") {
            let page = extractPageParameter(from: url)
            return .lotto6aus49(page: page)
        } else if path.contains("faq") {
            return .faq
        } else if path.contains("normalschein") {
            let page = extractPageParameter(from: url)
            return .normalschein(page: page)
        }
        
        return .unknown
    }
    
    private func extractPageParameter(from url: URL) -> String? {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        return components?.queryItems?.first(where: { $0.name == "page" })?.value
    }
    
    func handle(_ type: DeepLinkType) {
        switch type {
        case .lotto6aus49(let page):
            print("Navigate to Lotto 6 aus 49 with page: \(page ?? "default")")
            
        case .faq:
            print("Navigate to FAQ")
            
        case .normalschein(let page):
            print("Navigate to Normalschein with page: \(page ?? "default")")
            
        case .unknown:
            print("Unknown deeplink type")
        }
    }
}
