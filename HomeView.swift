//
//  HomeView.swift
//  Dashboard with Emotional Salad integration
//

import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    @State private var showQuickCheck = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Greeting
                    GreetingSection(viewModel: viewModel)
                    
                    // Emotional Salad Quick Button
                    EmotionalSaladCard {
                        showQuickCheck = true
                    }
                    
                    // Streak
                    StreakCard(streak: viewModel.currentStreak)
                    
                    // Quick exercises
                    QuickExercisesSection(viewModel: viewModel)
                    
                    // Recent check-ins
                    RecentCheckInsSection(viewModel: viewModel)
                    
                    // Daily quote
                    QuoteCard()
                }
                .padding()
            }
            .navigationTitle("Mindfulness")
            .sheet(isPresented: $showQuickCheck) {
                EmotionalSaladView(viewModel: viewModel)
            }
        }
    }
}

struct GreetingSection: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<22: return "Good evening"
        default: return "Good night"
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(greeting),")
                .font(.title2)
                .foregroundColor(.secondary)
            
            Text("Ready to check your emotional salad?")
                .font(.title)
                .fontWeight(.bold)
            
            if let lastCheckIn = viewModel.lastCheckIn {
                Text("Last check-in: \(lastCheckIn.date, style: .relative) ago")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            LinearGradient(
                colors: [.teal.opacity(0.8), .blue.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .foregroundColor(.white)
        .cornerRadius(16)
    }
}

struct EmotionalSaladCard: View {
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    Text("🥗")
                        .font(.title)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Check Your Emotional Salad")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("20 questions to identify spicy, greasy, and vegetables")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.leading)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.white)
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [.orange.opacity(0.8), .red.opacity(0.6)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct StreakCard: View {
    let streak: Int
    
    var body: some View {
        HStack {
            Image(systemName: "flame.fill")
                .font(.title)
                .foregroundColor(.orange)
            
            VStack(alignment: .leading) {
                Text("\(streak) Day Streak")
                    .font(.headline)
                Text("Keep it up!")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Mini calendar
            HStack(spacing: 4) {
                ForEach(0..<7) { day in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(day < streak % 7 ? Color.teal : Color.gray.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct QuickExercisesSection: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    let exercises: [(icon: String, title: String, duration: Int, color: Color)] = [
        ("wind", "Breathing", 3, .teal),
        ("ear.fill", "Body Scan", 10, .blue),
        ("heart.fill", "Loving Kindness", 5, .pink),
        ("moon.fill", "Sleep Relaxation", 15, .indigo)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Start")
                .font(.headline)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(exercises, id: \.title) { exercise in
                    QuickExerciseButton(exercise: exercise)
                }
            }
        }
    }
}

struct QuickExerciseButton: View {
    let exercise: (icon: String, title: String, duration: Int, color: Color)
    
    var body: some View {
        Button(action: {}) {
            VStack(spacing: 8) {
                Image(systemName: exercise.icon)
                    .font(.title2)
                    .foregroundColor(exercise.color)
                
                Text(exercise.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("\(exercise.duration) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct RecentCheckInsSection: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Check-ins")
                .font(.headline)
            
            if viewModel.recentCheckIns.isEmpty {
                Text("No check-ins yet. Start with your first Emotional Salad check!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
            } else {
                ForEach(viewModel.recentCheckIns.prefix(3)) { checkIn in
                    CheckInRow(checkIn: checkIn)
                }
            }
        }
    }
}

struct CheckInRow: View {
    let checkIn: EmotionalCheckIn
    
    var body: some View {
        HStack {
            Text("🥗")
                .font(.title3)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Emotional Salad Check")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("Spicy: \(checkIn.spiceEmotion)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                Text(checkIn.date, style: .date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct QuoteCard: View {
    let quotes = [
        "The old you just reacted. The you now is learning to choose.",
        "If I weren't trying to feel powerful at all, what would I want?",
        "The pause between feeling and action is where freedom lives.",
        "Inner power is the capacity to tolerate emptiness without panic."
    ]
    
    var randomQuote: String {
        quotes.randomElement() ?? quotes[0]
    }
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "quote.opening")
                .font(.title)
                .foregroundColor(.teal)
            
            Text("\"\(randomQuote)\"")
                .font(.body)
                .italic()
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(12)
    }
}
