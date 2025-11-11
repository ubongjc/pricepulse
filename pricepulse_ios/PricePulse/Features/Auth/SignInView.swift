import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var showingSignUp = false
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Logo and Title
                VStack(spacing: 16) {
                    Image(systemName: "cart.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.blue)

                    Text("PricePulse")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Track your grocery inflation")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 60)

                Spacer()

                // Sign In Button
                Button {
                    Task {
                        isLoading = true
                        await authManager.signInWithPasskey()
                        isLoading = false
                    }
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Image(systemName: "person.badge.key")
                            Text("Sign In with Passkey")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isLoading)

                // Sign Up Button
                Button {
                    showingSignUp = true
                } label: {
                    Text("Create Account")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(12)
                }

                // Privacy Notice
                Text("Your data is encrypted client-side before upload")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                Spacer()
            }
            .padding()
            .sheet(isPresented: $showingSignUp) {
                SignUpView()
            }
            .alert("Authentication Error", isPresented: .constant(authManager.error != nil)) {
                Button("OK") {
                    authManager.error = nil
                }
            } message: {
                if let error = authManager.error {
                    Text(error.localizedDescription)
                }
            }
        }
    }
}

struct SignUpView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                } header: {
                    Text("Account Information")
                }

                Section {
                    Button {
                        Task {
                            isLoading = true
                            await authManager.signUpWithPasskey(email: email)
                            isLoading = false
                            if authManager.isAuthenticated {
                                dismiss()
                            }
                        }
                    } label: {
                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                        } else {
                            Text("Create Account with Passkey")
                        }
                    }
                    .disabled(email.isEmpty || isLoading)
                } footer: {
                    Text("A passkey will be created on this device for secure authentication")
                }
            }
            .navigationTitle("Sign Up")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    SignInView()
        .environmentObject(AuthManager())
}
