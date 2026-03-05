//
//  MindfulnessViewModel.swift
//  Data models and view model
//

import SwiftUI
import Combine

class MindfulnessViewModel: ObservableObject {
    @Published var sessions: [MindfulnessSession] = []
    @Published var journalEntries: [JournalEntry] = []
    @Published var checkIns: [EmotionalCheckIn] = []
    @Published var todayMood: Int = 0
    @Published var currentStreak: Int = 0
    @Published var weeklyGoal: Int = 70
    
    init() {
        loadData()
        calculateStreak()
    }
    
    // MARK: - Sessions
    func saveSession(type: ExerciseType, duration: Int) {
        let session = MindfulnessSession(
            id: UUID(),
            date: Date(),
            exerciseType: type,
            duration: duration
        )
        sessions.append(session)
        saveData()
        calculateStreak()
    }
    
    func getDefaultDuration(for type: ExerciseType) -> Int {
        switch type {
        case .breathing: return 5
        case .bodyScan: return 15
        case .lovingKindness: return 10
        case .mindfulWalking: return 10
        case .sleepRelaxation: return 20
        case .mindfulEating: return 10
        case .gratitude: return 5
        case .anxietyRelief: return 10
        }
    }
    
    // MARK: - Journal
    func addJournalEntry(title: String, content: String, mood: Int) {
        let entry = JournalEntry(
            id: UUID(),
            date: Date(),
            title: title,
            content: content,
            mood: mood
        )
        journalEntries.append(entry)
        saveData()
    }
    
    func logMood(_ mood: Int) {
        todayMood = mood
        saveData()
    }
    
    // MARK: - Emotional Check-ins
    func addCheckIn(_ checkIn: EmotionalCheckIn) {
        checkIns.append(checkIn)
        saveData()
        calculateStreak()
    }
    
    // MARK: - Computed Properties
    var recentSessions: [MindfulnessSession] {
        sessions.sorted(by: { $0.date > $1.date })
    }
    
    var lastSessionDate: Date? {
        sessions.sorted(by: { $0.date > $1.date }).first?.date
    }
    
    var lastCheckIn: EmotionalCheckIn? {
        checkIns.sorted(by: { $0.date > $1.date }).first
    }
    
    var recentCheckIns: [EmotionalCheckIn] {
        checkIns.sorted(by: { $0.date > $1.date })
    }
    
    var totalSessions: Int {
        sessions.count + checkIns.count
    }
    
    var totalMinutes: Int {
        sessions.reduce(0) { $0 + $1.duration }
    }
    
    var averageSessionLength: Double {
        guard !sessions.isEmpty else { return 0 }
        return Double(totalMinutes) / Double(sessions.count)
    }
    
    var weeklyData: [(day: String, minutes: Int)] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var data: [(String, Int)] = []
        
        let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        
        for dayOffset in 0..<7 {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) else { continue }
            let dayName = dayNames[calendar.component(.weekday, from: date) - 1]
            
            let sessionMinutes = sessions
                .filter { calendar.isDate($0.date, inSameDayAs: date) }
                .reduce(0) { $0 + $1.duration }
            
            let checkInCount = checkIns
                .filter { calendar.isDate($0.date, inSameDayAs: date) }
                .count * 5 // Estimate 5 min per check-in
            
            data.append((dayName, sessionMinutes + checkInCount))
        }
        
        return data.reversed()
    }
    
    var weeklyTotal: Int {
        weeklyData.reduce(0) { $0 + $1.minutes }
    }
    
    // MARK: - Streak
    func calculateStreak() {
        let calendar = Calendar.current
        let allActivities = (sessions.map { $0.date } + checkIns.map { $0.date }).sorted(by: >)
        
        guard !allActivities.isEmpty else {
            currentStreak = 0
            return
        }
        
        var streak = 0
        var currentDate = calendar.startOfDay(for: Date())
        
        // Check if practiced today
        let practicedToday = allActivities.contains { calendar.isDate($0, inSameDayAs: currentDate) }
        
        if !practicedToday {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: currentDate),
                  allActivities.contains(where: { calendar.isDate($0, inSameDayAs: yesterday) }) else {
                currentStreak = 0
                return
            }
            currentDate = yesterday
        }
        
        while true {
            let practiced = allActivities.contains { calendar.isDate($0, inSameDayAs: currentDate) }
            if practiced {
                streak += 1
                guard let previousDay = calendar.date(byAdding: .day, value: -1, to: currentDate) else { break }
                currentDate = previousDay
            } else {
                break
            }
        }
        
        currentStreak = streak
    }
    
    // MARK: - Persistence
    private func saveData() {
        // In production, use Core Data or UserDefaults
    }
    
    private func loadData() {
        // Load from persistent storage
    }
}

// MARK: - Models
enum ExerciseType: String, CaseIterable, Identifiable {
    case breathing = "Breathing"
    case bodyScan = "Body Scan"
    case lovingKindness = "Loving Kindness"
    case mindfulWalking = "Mindful Walking"
    case sleepRelaxation = "Sleep Relaxation"
    case mindfulEating = "Mindful Eating"
    case gratitude = "Gratitude"
    case anxietyRelief = "Anxiety Relief"
    
    var id: String { rawValue }
    
    var icon: String {
        switch self {
        case .breathing: return "wind"
        case .bodyScan: return "ear.fill"
        case .lovingKindness: return "heart.fill"
        case .mindfulWalking: return "figure.walk"
        case .sleepRelaxation: return "moon.fill"
        case .mindfulEating: return "fork.knife"
        case .gratitude: return "sun.max.fill"
        case .anxietyRelief: return "sparkles"
        }
    }
}

struct MindfulnessSession: Identifiable {
    let id: UUID
    let date: Date
    let exerciseType: ExerciseType
    let duration: Int
}

struct JournalEntry: Identifiable {
    let id: UUID
    let date: Date
    let title: String
    let content: String
    let mood: Int
}

struct EmotionalCheckIn: Identifiable {
    let id = UUID()
    let date: Date
    let spiceEmotion: String
    let greaseCraving: String
    let vegetableNeed: String
    let answers: [String: String]
}
