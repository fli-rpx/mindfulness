//
//  MindfulnessTherapyApp.swift
//  Mindfulness Therapy - Emotional Salad Edition
//

import SwiftUI
import Combine

@main
struct MindfulnessTherapyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            print("Notifications granted: \(granted)")
        }
        return true
    }
}

class AppState: ObservableObject {
    @Published var hasCompletedOnboarding = false
    @Published var currentStreak: Int = 0
    @Published var totalSessions: Int = 0
}
