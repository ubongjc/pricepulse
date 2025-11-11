import Foundation
import Combine

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var dataSharingPreference: DataSharingPreference = .anonymous
    @Published var error: Error?

    private let apiService = APIService()

    func updateDataSharingPreference(_ preference: DataSharingPreference) async {
        do {
            let request = UserUpdateRequest(
                firstName: nil,
                lastName: nil,
                dataSharingPreference: preference
            )
            let _ = try await apiService.updateUser(request)
        } catch {
            self.error = error
            // Revert on error
            self.dataSharingPreference = dataSharingPreference
        }
    }

    func requestDataExport() async {
        do {
            let _ = try await apiService.requestDataExport()
            // Show success message or handle response
        } catch {
            self.error = error
        }
    }

    func deleteAccount() async {
        do {
            try await apiService.deleteUserData()
        } catch {
            self.error = error
        }
    }
}
