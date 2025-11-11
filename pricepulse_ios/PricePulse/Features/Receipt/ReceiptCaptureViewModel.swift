import SwiftUI
import Combine

@MainActor
class ReceiptCaptureViewModel: ObservableObject {
    @Published var capturedImage: UIImage?
    @Published var storeName = ""
    @Published var postalCode = ""
    @Published var transactionDate = Date()
    @Published var totalAmount: Double = 0.0
    @Published var lineItems: [LineItemInput] = []
    @Published var isProcessing = false
    @Published var error: Error?

    private let apiService = APIService()
    private let cryptoManager = CryptoManager.shared

    var isValid: Bool {
        !storeName.isEmpty && totalAmount > 0 && !lineItems.isEmpty
    }

    func addLineItem() {
        lineItems.append(LineItemInput())
    }

    func processImage() async {
        guard let image = capturedImage else { return }

        isProcessing = true

        // TODO: Implement OCR processing
        // For now, just add a default line item
        await MainActor.run {
            if lineItems.isEmpty {
                addLineItem()
            }
            isProcessing = false
        }
    }

    func saveReceipt() async {
        guard isValid else { return }

        isProcessing = true

        do {
            var receiptImageKey: String?
            var receiptImageUrl: String?

            // Encrypt and upload receipt image if available
            if let image = capturedImage,
               let imageData = image.jpegData(compressionQuality: 0.8) {
                let (encryptedData, keyIdentifier) = try cryptoManager.encryptReceiptImage(imageData)
                receiptImageKey = keyIdentifier

                // TODO: Upload encrypted image to R2 and get URL
                // For now, just use a placeholder
                receiptImageUrl = "placeholder_url"
            }

            // Create receipt request
            let request = ReceiptIngestRequest(
                storeName: storeName,
                storeLocation: nil,
                postalCode: postalCode.isEmpty ? nil : postalCode,
                transactionDate: transactionDate,
                totalAmount: totalAmount,
                taxAmount: nil,
                receiptImageUrl: receiptImageUrl,
                receiptImageKey: receiptImageKey,
                lineItems: lineItems.map { item in
                    LineItemRequest(
                        productName: item.productName,
                        upc: nil,
                        quantity: item.quantity,
                        unitSize: nil,
                        unitSizeNormalized: nil,
                        unitType: nil,
                        unitPrice: item.totalPrice / item.quantity,
                        totalPrice: item.totalPrice,
                        category: nil,
                        brand: nil,
                        metadata: nil
                    )
                },
                metadata: nil
            )

            // Send to backend
            let _ = try await apiService.ingestReceipt(request)

            // Reset form on success
            await MainActor.run {
                reset()
                isProcessing = false
            }
        } catch {
            await MainActor.run {
                self.error = error
                isProcessing = false
            }
        }
    }

    func reset() {
        capturedImage = nil
        storeName = ""
        postalCode = ""
        transactionDate = Date()
        totalAmount = 0.0
        lineItems = []
    }
}

struct LineItemInput: Identifiable {
    let id = UUID()
    var productName = ""
    var quantity: Double = 1.0
    var totalPrice: Double = 0.0
}
