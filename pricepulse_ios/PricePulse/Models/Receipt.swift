import Foundation

// MARK: - Receipt Models

struct Receipt: Codable, Identifiable {
    let id: String
    let userId: String
    let storeName: String
    let storeLocation: String?
    let postalCode: String?
    let transactionDate: Date
    let totalAmount: Double
    let taxAmount: Double?
    let receiptImageUrl: String?
    let receiptImageKey: String?
    let ocrProcessed: Bool
    let ocrProcessedAt: Date?
    let metadata: [String: String]?
    let createdAt: Date
    let updatedAt: Date
    let lineItems: [LineItem]?
}

struct LineItem: Codable, Identifiable {
    let id: String
    let receiptId: String
    let productName: String
    let upc: String?
    let quantity: Double
    let unitSize: String?
    let unitSizeNormalized: Double?
    let unitType: String?
    let unitPrice: Double
    let totalPrice: Double
    let category: String?
    let brand: String?
    let metadata: [String: String]?
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Request Models

struct ReceiptIngestRequest: Codable {
    let storeName: String
    let storeLocation: String?
    let postalCode: String?
    let transactionDate: Date
    let totalAmount: Double
    let taxAmount: Double?
    let receiptImageUrl: String?
    let receiptImageKey: String?
    let lineItems: [LineItemRequest]
    let metadata: [String: String]?
}

struct LineItemRequest: Codable {
    let productName: String
    let upc: String?
    let quantity: Double
    let unitSize: String?
    let unitSizeNormalized: Double?
    let unitType: String?
    let unitPrice: Double
    let totalPrice: Double
    let category: String?
    let brand: String?
    let metadata: [String: String]?
}
