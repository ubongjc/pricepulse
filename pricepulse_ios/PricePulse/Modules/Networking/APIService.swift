import Foundation

/// API service for PricePulse backend
struct APIService {
    private let networkManager: NetworkManager

    init(networkManager: NetworkManager = .shared) {
        self.networkManager = networkManager
    }

    // MARK: - Health Check

    func checkHealth() async throws -> HealthResponse {
        return try await networkManager.request(endpoint: "/api/health")
    }

    // MARK: - Receipt Management

    func ingestReceipt(_ request: ReceiptIngestRequest) async throws -> ReceiptIngestResponse {
        return try await networkManager.request(
            endpoint: "/api/receipt/ingest",
            method: .post,
            body: request
        )
    }

    func getReceipts(limit: Int = 50, offset: Int = 0) async throws -> [Receipt] {
        return try await networkManager.request(
            endpoint: "/api/receipts?limit=\(limit)&offset=\(offset)"
        )
    }

    func getReceipt(id: String) async throws -> Receipt {
        return try await networkManager.request(endpoint: "/api/receipts/\(id)")
    }

    func deleteReceipt(id: String) async throws {
        let _: EmptyResponse = try await networkManager.request(
            endpoint: "/api/receipts/\(id)",
            method: .delete
        )
    }

    // MARK: - User Management

    func getCurrentUser() async throws -> User {
        return try await networkManager.request(endpoint: "/api/user")
    }

    func updateUser(_ request: UserUpdateRequest) async throws -> User {
        return try await networkManager.request(
            endpoint: "/api/user",
            method: .patch,
            body: request
        )
    }

    // MARK: - Data Export

    func requestDataExport() async throws -> DataExportResponse {
        return try await networkManager.request(
            endpoint: "/api/user/export",
            method: .post
        )
    }

    func deleteUserData() async throws {
        let _: EmptyResponse = try await networkManager.request(
            endpoint: "/api/user",
            method: .delete
        )
    }
}

// MARK: - Response Models

struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let database: String
    let version: String?
}

struct ReceiptIngestResponse: Codable {
    let message: String
    let receipt: ReceiptSummary

    struct ReceiptSummary: Codable {
        let id: String
        let storeName: String
        let transactionDate: Date
        let totalAmount: Double
        let lineItemCount: Int
    }
}

struct DataExportResponse: Codable {
    let message: String
    let exportId: String
    let status: String
}

struct EmptyResponse: Codable {}
