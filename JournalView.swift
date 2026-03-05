//
//  JournalView.swift
//  Mood tracking and journaling
//

import SwiftUI

struct JournalView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    @State private var showingAddEntry = false
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("How are you feeling?")) {
                    MoodTrackerView(viewModel: viewModel)
                }
                
                Section(header: Text("Quick Check-in")) {
                    QuickCheckInView(viewModel: viewModel)
                }
                
                Section(header: Text("Journal Entries")) {
                    ForEach(viewModel.journalEntries.sorted(by: { $0.date > $1.date })) { entry in
                        JournalEntryRow(entry: entry)
                    }
                }
            }
            .navigationTitle("Journal")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddEntry = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddEntry) {
                AddJournalEntryView(viewModel: viewModel)
            }
        }
    }
}

struct MoodTrackerView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    let moods = [
        ("😢", "Sad", 1),
        ("😕", "Down", 2),
        ("😐", "Okay", 3),
        ("🙂", "Good", 4),
        ("😊", "Great", 5)
    ]
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Tap to log your mood")
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(spacing: 20) {
                ForEach(moods, id: \.1) { mood in
                    MoodButton(
                        emoji: mood.0,
                        label: mood.1,
                        isSelected: viewModel.todayMood == mood.2
                    ) {
                        viewModel.logMood(mood.2)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct MoodButton: View {
    let emoji: String
    let label: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(emoji)
                    .font(.title)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .teal : .secondary)
            }
            .padding(8)
            .background(isSelected ? Color.teal.opacity(0.2) : Color.clear)
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct QuickCheckInView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    
    let prompts = [
        "What are you grateful for today?",
        "What's one thing that went well?",
        "What are you looking forward to?",
        "What's the spiciest emotion right now?",
        "What greasy thing are you reaching for?",
        "What vegetable do you actually need?"
    ]
    
    @State private var currentPrompt = 0
    @State private var response = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(prompts[currentPrompt])
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            TextEditor(text: $response)
                .frame(height: 80)
                .padding(8)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            
            HStack {
                Button("New Prompt") {
                    currentPrompt = Int.random(in: 0..<prompts.count)
                }
                .font(.caption)
                .foregroundColor(.teal)
                
                Spacer()
                
                Button("Save") {
                    viewModel.addJournalEntry(
                        title: "Quick Check-in",
                        content: response,
                        mood: viewModel.todayMood
                    )
                    response = ""
                }
                .font(.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.teal)
                .cornerRadius(8)
                .disabled(response.isEmpty)
            }
        }
        .padding(.vertical, 8)
    }
}

struct JournalEntryRow: View {
    let entry: JournalEntry
    
    var moodEmoji: String {
        switch entry.mood {
        case 1: return "😢"
        case 2: return "😕"
        case 3: return "😐"
        case 4: return "🙂"
        case 5: return "😊"
        default: return "📝"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Text(moodEmoji)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text(entry.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                Text(entry.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddJournalEntryView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var title = ""
    @State private var content = ""
    @State private var selectedMood = 3
    
    let moods = ["😢", "😕", "😐", "🙂", "😊"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Title")) {
                    TextField("Entry title", text: $title)
                }
                
                Section(header: Text("How are you feeling?")) {
                    HStack {
                        ForEach(0..<moods.count, id: \.self) { index in
                            Button(action: { selectedMood = index + 1 }) {
                                Text(moods[index])
                                    .font(.title)
                                    .opacity(selectedMood == index + 1 ? 1.0 : 0.4)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                
                Section(header: Text("Your thoughts")) {
                    TextEditor(text: $content)
                        .frame(minHeight: 150)
                }
                
                Section {
                    Button("Save Entry") {
                        viewModel.addJournalEntry(
                            title: title.isEmpty ? "Journal Entry" : title,
                            content: content,
                            mood: selectedMood
                        )
                        dismiss()
                    }
                    .disabled(content.isEmpty)
                }
            }
            .navigationTitle("New Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
