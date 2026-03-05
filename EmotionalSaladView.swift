//
//  EmotionalSaladView.swift
//  The 20 Questions Framework - Core Feature
//

import SwiftUI

struct EmotionalSaladView: View {
    @ObservedObject var viewModel: MindfulnessViewModel
    @State private var currentStep = 0
    @State private var answers: [String: String] = [:]
    @State private var showResults = false
    @State private var selectedSpice: String = ""
    @State private var selectedGrease: String = ""
    @State private var selectedVegetable: String = ""
    
    let spicyQuestions: [(id: String, text: String, options: [String])] = [
        ("emotion_now", "What emotion am I feeling most right now?", ["Anger", "Fear", "Shame", "Emptiness", "Powerlessness", "Anxiety", "Sadness"]),
        ("body_location", "Where in my body do I feel this emotion?", ["Chest tightness", "Stomach knot", "Heat in face", "Cold hands", "Tension in shoulders", "Lump in throat", "Cannot feel anything"]),
        ("intensity", "On a scale of 1-10, how intense is this feeling?", ["1-3 (Mild)", "4-6 (Moderate)", "7-8 (Strong)", "9-10 (Overwhelming)"]),
        ("trigger", "What just happened before this feeling arose?", ["A loss", "Rejection", "Failure", "Reminded of past", "Conflict", "Uncertainty", "Nothing specific"]),
        ("familiar", "Does this feeling remind me of any past situation?", ["Childhood", "Past relationship", "Work situation", "Family pattern", "This is new", "Happens often"]),
        ("story", "What story is my mind telling me?", ["I am not enough", "I am losing control", "I need to fix this", "I am being abandoned", "I must prove myself", "Something else"]),
        ("need", "If this emotion could speak, what would it say it needs?", ["Safety", "Connection", "Recognition", "Rest", "Control", "Love", "Just to be heard"])
    ]
    
    let greasyQuestions: [(id: String, text: String, options: [String])] = [
        ("urge", "What do I urgently want to do right now?", ["Reach out to someone", "Seek attention", "Escape/avoid", "Control something", "Prove myself", "Get validation", "Something else"]),
        ("fixation", "Is there a specific person or type of person I am fixating on?", ["Ex/partner", "Authority figure", "Someone I am attracted to", "Family member", "No one specific", "A fantasy/ideal"]),
        ("aftermath", "If I acted on this urge, how would I feel immediately after?", ["Relieved temporarily", "Ashamed", "Empty", "Powerful briefly", "Regretful", "Satisfied"]),
        ("next_day", "How would I feel the next day?", ["Regret", "Same emptiness", "Shame", "Nothing changed", "Briefly better", "Worse than before"]),
        ("avoiding", "What would I be avoiding feeling if I gave in?", ["Emptiness", "Powerlessness", "Shame", "Fear", "Loneliness", "I do not know"]),
        ("greasy_food", "What is the greasy food I am reaching for?", ["Attention/affection", "Control/power", "Validation", "Escape", "Temporary high", "Sense of winning"])
    ]
    
    let vegetableQuestions: [(id: String, text: String, options: [String])] = [
        ("opposite", "What would the opposite of this craving feel like?", ["Letting go", "Being present", "Accepting", "Connecting genuinely", "Resting", "Being vulnerable"]),
        ("true_need", "What do I truly need right now?", ["Connection", "Rest", "Safety", "Recognition", "Purpose", "Self-compassion", "Truth"]),
        ("genuine_connect", "Is there someone I could connect with genuinely, without agenda?", ["Yes, a friend", "Yes, family", "A therapist/counselor", "Not right now", "I need to be alone first"]),
        ("sit_with_it", "What would it feel like to sit with this emotion for 5 minutes?", ["Scary but possible", "Overwhelming", "Like it would pass", "I do not know", "I have done it before"]),
        ("proud_action", "What is one small thing I could do to feel proud tomorrow?", ["Journal honestly", "Reach out to someone", "Complete a small task", "Rest without guilt", "Practice mindfulness", "Set a boundary"]),
        ("without_power", "If I were not trying to feel powerful, what would I want?", ["Peace", "Connection", "Meaning", "Rest", "To be seen", "To create something", "Just to be"]),
        ("which_self", "Which version of me is running the show?", ["The powerful one (owning)", "The weak one (hiding)", "The clear one (connecting)", "A mix of all three", "I do not know"]),
        ("add_vegetable", "If I could add one vegetable to balance this, which would help most?", ["Calm", "Connection", "Rest", "Meaning", "Truth", "Self-compassion", "Presence"])
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    if !showResults {
<<<<<<< HEAD
                        // Progress indicator
                        SwiftUI.ProgressView(value: Double(currentStep), total: Double(totalSteps))
=======
                        ProgressView(value: Double(currentStep), total: Double(totalSteps))
>>>>>>> febfe297716b94ffc13594b477c8b22f5e7b02f9
                            .padding(.horizontal)
                        
                        Text("Question \(currentStep + 1) of \(totalSteps)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if currentStep < spicyQuestions.count {
                            QuestionCard(
                                title: "Spicy (Overwhelming)",
                                question: spicyQuestions[currentStep].text,
                                options: spicyQuestions[currentStep].options,
                                selected: answers[spicyQuestions[currentStep].id],
                                color: .red
                            ) { answer in
                                answers[spicyQuestions[currentStep].id] = answer
                                if answer.contains("Anger") || answer.contains("Fear") || answer.contains("Shame") {
                                    selectedSpice = answer
                                }
                            }
                        } else if currentStep < spicyQuestions.count + greasyQuestions.count {
                            let idx = currentStep - spicyQuestions.count
                            QuestionCard(
                                title: "Greasy (Compulsive)",
                                question: greasyQuestions[idx].text,
                                options: greasyQuestions[idx].options,
                                selected: answers[greasyQuestions[idx].id],
                                color: .orange
                            ) { answer in
                                answers[greasyQuestions[idx].id] = answer
                                selectedGrease = answer
                            }
                        } else {
                            let idx = currentStep - spicyQuestions.count - greasyQuestions.count
                            QuestionCard(
                                title: "Vegetables (Nourishing)",
                                question: vegetableQuestions[idx].text,
                                options: vegetableQuestions[idx].options,
                                selected: answers[vegetableQuestions[idx].id],
                                color: .green
                            ) { answer in
                                answers[vegetableQuestions[idx].id] = answer
                                selectedVegetable = answer
                            }
                        }
                        
                        HStack(spacing: 20) {
                            if currentStep > 0 {
                                Button("Previous") {
                                    withAnimation {
                                        currentStep -= 1
                                    }
                                }
                                .buttonStyle(SecondaryButtonStyle())
                            }
                            
                            Spacer()
                            
                            Button(currentStep < totalSteps - 1 ? "Next" : "See Results") {
                                withAnimation {
                                    if currentStep < totalSteps - 1 {
                                        currentStep += 1
                                    } else {
                                        showResults = true
                                        saveCheckIn()
                                    }
                                }
                            }
                            .buttonStyle(PrimaryButtonStyle())
                        }
                        .padding(.horizontal)
                    } else {
                        SaladResultsView(
                            spice: selectedSpice,
                            grease: selectedGrease,
                            vegetable: selectedVegetable,
                            answers: answers,
                            onReset: {
                                currentStep = 0
                                answers = [:]
                                showResults = false
                                selectedSpice = ""
                                selectedGrease = ""
                                selectedVegetable = ""
                            }
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Emotional Salad Check")
        }
    }
    
    var totalSteps: Int {
        spicyQuestions.count + greasyQuestions.count + vegetableQuestions.count
    }
    
    func saveCheckIn() {
        let checkIn = EmotionalCheckIn(
            date: Date(),
            spiceEmotion: selectedSpice,
            greaseCraving: selectedGrease,
            vegetableNeed: selectedVegetable,
            answers: answers
        )
        viewModel.addCheckIn(checkIn)
    }
}

struct QuestionCard: View {
    let title: String
    let question: String
    let options: [String]
    let selected: String?
    let color: Color
    let onSelect: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(color)
                .textCase(.uppercase)
                .tracking(1)
            
            Text(question)
                .font(.title3)
                .fontWeight(.medium)
                .fixedSize(horizontal: false, vertical: true)
            
            VStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    Button(action: { onSelect(option) }) {
                        HStack {
                            Text(option)
                                .font(.body)
                                .foregroundColor(selected == option ? .white : .primary)
                                .multilineTextAlignment(.leading)
                            
                            Spacer()
                            
                            if selected == option {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.white)
                            }
                        }
                        .padding()
                        .background(selected == option ? color : Color(.secondarySystemBackground))
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

struct SaladResultsView: View {
    let spice: String
    let grease: String
    let vegetable: String
    let answers: [String: String]
    let onReset: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Your Emotional Salad")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(spacing: 16) {
                if !spice.isEmpty {
                    ResultItem(
                        icon: "Spicy",
                        title: "Spicy",
                        subtitle: spice,
                        color: .red,
                        description: "This is what is overwhelming you right now."
                    )
                }
                
                if !grease.isEmpty {
                    ResultItem(
                        icon: "Greasy",
                        title: "Greasy",
                        subtitle: grease,
                        color: .orange,
                        description: "This is what you are reaching for to cope."
                    )
                }
                
                if !vegetable.isEmpty {
                    ResultItem(
                        icon: "Vegetable",
                        title: "Vegetable",
                        subtitle: vegetable,
                        color: .green,
                        description: "This is what would actually nourish you."
                    )
                }
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Your 7-Step Balancing Protocol")
                    .font(.headline)
                    .padding(.bottom, 4)
                
                ForEach(Array(protocolSteps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(width: 24, height: 24)
                            .background(Color.teal)
                            .cornerRadius(12)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(step.title)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(step.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
            
            RecommendedActions(spice: spice, vegetable: vegetable)
            
            Button("Start New Check-in") {
                onReset()
            }
            .buttonStyle(SecondaryButtonStyle())
            .padding(.top)
        }
    }
    
    var protocolSteps: [(title: String, description: String)] {
        [
            ("Stop", "Physically pause. Do not act. Take one slow breath."),
            ("Name the Spiciness", "What is too spicy? \(spice.isEmpty ? "Powerlessness" : spice)"),
            ("Locate It", "Where do you feel this in your body? Just notice."),
            ("Identify the Craving", "What are you reaching for? \(grease.isEmpty ? "External validation" : grease)"),
            ("Choose a Vegetable", "What would nourish you? \(vegetable.isEmpty ? "Rest" : vegetable)"),
            ("Take Action", "Do it for just 2 minutes."),
            ("Notice", "How do you feel? Not perfect, just different.")
        ]
    }
}

struct ResultItem: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Text(icon)
                .font(.title)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(color)
                
                Text(subtitle)
                    .font(.body)
                    .fontWeight(.medium)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct RecommendedActions: View {
    let spice: String
    let vegetable: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommended Actions")
                .font(.headline)
            
            if spice.contains("Anger") || spice.contains("Fear") {
                ActionRow(icon: "wind", title: "5-4-3-2-1 Grounding", description: "Name 5 things you see, 4 you can touch...")
                ActionRow(icon: "lungs.fill", title: "Slow Exhale Breathing", description: "Inhale 4, hold 4, exhale 6. Repeat 5 times.")
            }
            
            if vegetable.contains("Rest") {
                ActionRow(icon: "bed.double.fill", title: "Guilt-Free Rest", description: "Lie down for 20 minutes with no phone.")
            }
            
            if vegetable.contains("Connection") {
                ActionRow(icon: "person.2.fill", title: "Reach Out", description: "Message someone without agenda, just to check in.")
            }
            
            ActionRow(icon: "pencil", title: "Journal", description: "Write one honest sentence about what you need.")
        }
        .padding()
        .background(Color.teal.opacity(0.1))
        .cornerRadius(12)
    }
}

struct ActionRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.teal)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.teal)
            .cornerRadius(25)
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.teal)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.teal.opacity(0.1))
            .cornerRadius(25)
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
    }
}
