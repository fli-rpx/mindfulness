//
//  ContentView.swift
//  Main tab navigation
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = MindfulnessViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(0)

            EnglishReadingCoachView()
                .tabItem {
                    Image(systemName: "text.book.closed.fill")
                    Text("English")
                }
                .tag(1)
            
            EmotionalSaladView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "leaf.fill")
                    Text("Salad Check")
                }
                .tag(2)
            
            ExercisesView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "play.circle.fill")
                    Text("Practice")
                }
                .tag(3)
            
            JournalView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "book.fill")
                    Text("Journal")
                }
                .tag(4)
            
            ProgressView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "chart.bar.fill")
                    Text("Progress")
                }
                .tag(5)
        }
        .accentColor(.teal)
    }
}
