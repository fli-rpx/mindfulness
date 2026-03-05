//
//  ProgressView.swift
//  Stats and achievements
//

import SwiftUI

struct ProgressView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    SummaryStatsView(viewModel: viewModel)
                    WeeklyChartView(viewModel: viewModel)
                    AchievementsView(viewModel: viewModel)
                    InsightsView(viewModel: viewModel)
                }
                .padding()
            }
            .navigationTitle("Progress")
            .background(Color(.systemGroupedBackground))
        }
    }
}

struct SummaryStatsView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var body: some View {
        HStack(spacing: 16) {
            StatCard(
                value: "\(viewModel.totalSessions)",
                label: "Total Sessions",
                icon: "checkmark.circle.fill",
                color: .teal
            )
            
            StatCard(
                value: "\(viewModel.totalMinutes)",
                label: "Minutes",
                icon: "clock.fill",
                color: .blue
            )
            
            StatCard(
                value: "\(viewModel.currentStreak)",
                label: "Day Streak",
                icon: "flame.fill",
                color: .orange
            )
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct WeeklyChartView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This Week")
                .font(.headline)
            
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(viewModel.weeklyData, id: \.day) { day in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(day.minutes > 0 ? Color.teal : Color.gray.opacity(0.3))
                            .frame(height: CGFloat(min(day.minutes, 60)))
                        
                        Text(day.day)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 100)
            .padding(.vertical, 8)
            
            Text("Total this week: \(viewModel.weeklyTotal) minutes")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct AchievementsView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var achievements: [(icon: String, title: String, unlocked: Bool)] {
        [
            ("sparkles", "First Step", viewModel.totalSessions >= 1),
            ("leaf.fill", "Salad Master", viewModel.checkIns.count >= 5),
            ("flame", "On Fire", viewModel.currentStreak >= 7),
            ("clock", "Time Master", viewModel.totalMinutes >= 100),
            ("heart.fill", "Self-Compassion", viewModel.journalEntries.count >= 3),
            ("pause.circle", "The Pause", viewModel.totalSessions >= 10)
        ]
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Achievements")
                .font(.headline)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(achievements, id: \.title) { achievement in
                    VStack(spacing: 8) {
                        Image(systemName: achievement.icon)
                            .font(.title2)
                            .foregroundColor(achievement.unlocked ? .teal : .gray.opacity(0.5))
                        
                        Text(achievement.title)
                            .font(.caption)
                            .foregroundColor(achievement.unlocked ? .primary : .secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(achievement.unlocked ? Color.teal.opacity(0.1) : Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct InsightsView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Insights")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 12) {
                InsightRow(
                    icon: "chart.line.uptrend.xyaxis",
                    text: progressInsight
                )
                
                InsightRow(
                    icon: "leaf.fill",
                    text: "You've checked your emotional salad \(viewModel.checkIns.count) times."
                )
                
                InsightRow(
                    icon: "quote.opening",
                    text: "The old you just reacted. The you now is learning to choose."
                )
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
    
    var progressInsight: String {
        if viewModel.totalSessions == 0 {
            return "Start your mindfulness journey today!"
        } else if viewModel.currentStreak >= 7 {
            return "Amazing! You've practiced for \(viewModel.currentStreak) days in a row."
        } else if viewModel.currentStreak > 0 {
            return "Great job! You're on a \(viewModel.currentStreak)-day streak."
        } else {
            return "Get back on track with a session today."
        }
    }
}

struct InsightRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.teal)
                .frame(width: 20)
            
            Text(text)
                .font(.subheadline)
                .lineSpacing(2)
        }
    }
}
