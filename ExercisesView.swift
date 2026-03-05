//
//  ExercisesView.swift
//  Guided mindfulness practices
//

import SwiftUI

struct ExercisesView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    @State private var selectedExercise: ExerciseType?
    @State private var showSession = false
    
    let exercises: [(type: ExerciseType, description: String, duration: Int, color: Color)] = [
        (.breathing, "Calm your mind with guided breathing", 5, .teal),
        (.bodyScan, "Release tension by scanning your body", 15, .blue),
        (.lovingKindness, "Cultivate compassion for yourself", 10, .pink),
        (.mindfulWalking, "Practice awareness while walking", 10, .green),
        (.sleepRelaxation, "Prepare for restful sleep", 20, .indigo),
        (.anxietyRelief, "Reduce anxiety and worry", 10, .purple),
        (.gratitude, "Reflect on what you're thankful for", 5, .yellow),
        (.mindfulEating, "Eat with full awareness", 10, .orange)
    ]
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("For When You're Feeling Spicy 🔥")) {
                    ForEach(exercises.filter { $0.type == .breathing || $0.type == .anxietyRelief }, id: \.type) { exercise in
                        ExerciseRow(exercise: exercise)
                            .onTapGesture {
                                selectedExercise = exercise.type
                                showSession = true
                            }
                    }
                }
                
                Section(header: Text("For When You Need Vegetables 🥗")) {
                    ForEach(exercises.filter { $0.type == .bodyScan || $0.type == .lovingKindness || $0.type == .gratitude }, id: \.type) { exercise in
                        ExerciseRow(exercise: exercise)
                            .onTapGesture {
                                selectedExercise = exercise.type
                                showSession = true
                            }
                    }
                }
                
                Section(header: Text("For Rest and Recovery 🌙")) {
                    ForEach(exercises.filter { $0.type == .sleepRelaxation || $0.type == .mindfulWalking }, id: \.type) { exercise in
                        ExerciseRow(exercise: exercise)
                            .onTapGesture {
                                selectedExercise = exercise.type
                                showSession = true
                            }
                    }
                }
            }
            .navigationTitle("Exercises")
            .sheet(isPresented: $showSession) {
                if let exercise = selectedExercise {
                    SessionView(viewModel: viewModel, exerciseType: exercise)
                }
            }
        }
    }
}

struct ExerciseRow: View {
    let exercise: (type: ExerciseType, description: String, duration: Int, color: Color)
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(exercise.color.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: exercise.type.icon)
                    .font(.title3)
                    .foregroundColor(exercise.color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.type.rawValue)
                    .font(.headline)
                
                Text(exercise.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Image(systemName: "clock")
                        .font(.caption)
                    Text("\(exercise.duration) min")
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
}

struct SessionView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    let exerciseType: ExerciseType
    
    @State private var timeRemaining: Int
    @State private var isRunning = false
    @State private var showCompletion = false
    @Environment(\.dismiss) var dismiss
    
    init(viewModel: MindfulnessViewModel, exerciseType: ExerciseType) {
        self.viewModel = viewModel
        self.exerciseType = exerciseType
        let duration = viewModel.getDefaultDuration(for: exerciseType)
        _timeRemaining = State(initialValue: duration * 60)
    }
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.teal.opacity(0.8), .blue.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                HStack {
                    Button("Close") { dismiss() }
                    Spacer()
                    Text(exerciseType.rawValue)
                        .font(.headline)
                    Spacer()
                    Button("Done") { completeSession() }
                        .opacity(isRunning ? 0 : 1)
                }
                .padding()
                .foregroundColor(.white)
                
                Spacer()
                
                ZStack {
                    Circle()
                        .stroke(lineWidth: 8)
                        .opacity(0.3)
                        .foregroundColor(.white)
                    
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .foregroundColor(.white)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 1), value: timeRemaining)
                    
                    Text(formattedTime)
                        .font(.system(size: 64, weight: .thin, design: .rounded))
                        .foregroundColor(.white)
                }
                .frame(width: 280, height: 280)
                
                Spacer()
                
                Button(action: { isRunning.toggle() }) {
                    Image(systemName: isRunning ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.white)
                }
                
                Spacer()
            }
        }
        .sheet(isPresented: $showCompletion) {
            CompletionView(exerciseType: exerciseType) { dismiss() }
        }
        .onAppear { isRunning = true }
    }
    
    var progress: CGFloat {
        let total = viewModel.getDefaultDuration(for: exerciseType) * 60
        return CGFloat(total - timeRemaining) / CGFloat(total)
    }
    
    var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    func completeSession() {
        let duration = viewModel.getDefaultDuration(for: exerciseType)
        viewModel.saveSession(type: exerciseType, duration: duration)
        showCompletion = true
    }
}

struct CompletionView: View {
    let exerciseType: ExerciseType
    let onComplete: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.teal)
            
            Text("Session Complete!")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("You've added a vegetable to your plate 🥗")
                .font(.title3)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Button(action: onComplete) {
                Text("Continue")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.teal)
                    .cornerRadius(12)
            }
            .padding()
        }
    }
}
