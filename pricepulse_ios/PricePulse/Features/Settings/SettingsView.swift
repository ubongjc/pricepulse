import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showingDataExportAlert = false
    @State private var showingDeleteAccountAlert = false

    var body: some View {
        NavigationStack {
            Form {
                // User Profile Section
                if let user = authManager.currentUser {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(user.displayName)
                                .font(.headline)
                            Text(user.email)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            if user.isPremium {
                                Label("Premium Member", systemImage: "star.fill")
                                    .font(.caption)
                                    .foregroundStyle(.yellow)
                                    .padding(.top, 4)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // Privacy & Data Section
                Section("Privacy & Data") {
                    Picker("Data Sharing", selection: $viewModel.dataSharingPreference) {
                        Text("None").tag(DataSharingPreference.none)
                        Text("Anonymous").tag(DataSharingPreference.anonymous)
                        Text("Full").tag(DataSharingPreference.full)
                    }
                    .onChange(of: viewModel.dataSharingPreference) { _, newValue in
                        Task {
                            await viewModel.updateDataSharingPreference(newValue)
                        }
                    }

                    Button("Export My Data") {
                        showingDataExportAlert = true
                    }

                    Button("Delete My Account", role: .destructive) {
                        showingDeleteAccountAlert = true
                    }
                }

                // Encryption Info Section
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Client-Side Encryption", systemImage: "lock.shield")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        Text("Your receipt images are encrypted on your device before upload. The server only stores encrypted data.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Security")
                } footer: {
                    Text("Encryption keys are stored securely in your device's keychain")
                }

                // About Section
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    Link(destination: URL(string: "https://pricepulse.app/privacy")!) {
                        HStack {
                            Text("Privacy Policy")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundStyle(.secondary)
                        }
                    }
                    Link(destination: URL(string: "https://pricepulse.app/terms")!) {
                        HStack {
                            Text("Terms of Service")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // Sign Out Section
                Section {
                    Button("Sign Out") {
                        authManager.signOut()
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .foregroundStyle(.red)
                }
            }
            .navigationTitle("Settings")
            .alert("Export Data", isPresented: $showingDataExportAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Export") {
                    Task {
                        await viewModel.requestDataExport()
                    }
                }
            } message: {
                Text("A download link will be sent to your email address with all your data.")
            }
            .alert("Delete Account", isPresented: $showingDeleteAccountAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task {
                        await viewModel.deleteAccount()
                        authManager.signOut()
                    }
                }
            } message: {
                Text("This action cannot be undone. All your data will be permanently deleted.")
            }
            .alert("Error", isPresented: .constant(viewModel.error != nil)) {
                Button("OK") {
                    viewModel.error = nil
                }
            } message: {
                if let error = viewModel.error {
                    Text(error.localizedDescription)
                }
            }
            .task {
                if let user = authManager.currentUser {
                    viewModel.dataSharingPreference = user.dataSharingPreference
                }
            }
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager())
}
