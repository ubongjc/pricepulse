import Foundation
import Combine

@MainActor
class ReceiptListViewModel: ObservableObject {
    @Published var receipts: [Receipt] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let apiService = APIService()

    func loadReceipts() async {
        isLoading = true

        do {
            receipts = try await apiService.getReceipts()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    func deleteReceipts(at indexSet: IndexSet) async {
        for index in indexSet {
            let receipt = receipts[index]

            do {
                try await apiService.deleteReceipt(id: receipt.id)
                receipts.remove(at: index)
            } catch {
                self.error = error
            }
        }
    }
}
