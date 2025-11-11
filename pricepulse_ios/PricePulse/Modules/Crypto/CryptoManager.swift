import Foundation
import CryptoKit

/// Manager for client-side encryption of sensitive data
class CryptoManager {
    static let shared = CryptoManager()

    private let keychain = KeychainManager.shared

    private init() {}

    // MARK: - Key Generation

    /// Generate a new symmetric encryption key
    func generateEncryptionKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }

    /// Store encryption key in keychain
    func storeKey(_ key: SymmetricKey, identifier: String) throws {
        let keyData = key.withUnsafeBytes { Data($0) }
        try keychain.store(data: keyData, forKey: identifier)
    }

    /// Retrieve encryption key from keychain
    func retrieveKey(identifier: String) throws -> SymmetricKey {
        let keyData = try keychain.retrieve(forKey: identifier)
        return SymmetricKey(data: keyData)
    }

    /// Delete encryption key from keychain
    func deleteKey(identifier: String) throws {
        try keychain.delete(forKey: identifier)
    }

    // MARK: - Encryption

    /// Encrypt data using AES-GCM
    func encrypt(data: Data, using key: SymmetricKey) throws -> EncryptedData {
        let sealedBox = try AES.GCM.seal(data, using: key)

        guard let combined = sealedBox.combined else {
            throw CryptoError.encryptionFailed
        }

        return EncryptedData(
            ciphertext: combined,
            algorithm: "AES-GCM-256"
        )
    }

    /// Decrypt data using AES-GCM
    func decrypt(encryptedData: EncryptedData, using key: SymmetricKey) throws -> Data {
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData.ciphertext)
        return try AES.GCM.open(sealedBox, using: key)
    }

    // MARK: - Hashing

    /// Generate SHA256 hash of data
    func hash(data: Data) -> String {
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    /// Generate SHA256 hash of string
    func hash(string: String) -> String {
        guard let data = string.data(using: .utf8) else {
            return ""
        }
        return hash(data: data)
    }

    // MARK: - Receipt Image Encryption

    /// Encrypt receipt image before upload
    func encryptReceiptImage(_ imageData: Data) throws -> (encrypted: EncryptedData, keyIdentifier: String) {
        // Generate unique key for this receipt
        let key = generateEncryptionKey()
        let keyIdentifier = UUID().uuidString

        // Store key in keychain
        try storeKey(key, identifier: keyIdentifier)

        // Encrypt image
        let encrypted = try encrypt(data: imageData, using: key)

        return (encrypted, keyIdentifier)
    }

    /// Decrypt receipt image after download
    func decryptReceiptImage(_ encryptedData: EncryptedData, keyIdentifier: String) throws -> Data {
        // Retrieve key from keychain
        let key = try retrieveKey(identifier: keyIdentifier)

        // Decrypt image
        return try decrypt(encryptedData: encryptedData, using: key)
    }
}

// MARK: - Models

struct EncryptedData: Codable {
    let ciphertext: Data
    let algorithm: String

    var base64Encoded: String {
        ciphertext.base64EncodedString()
    }

    init(ciphertext: Data, algorithm: String) {
        self.ciphertext = ciphertext
        self.algorithm = algorithm
    }

    init(base64Encoded: String, algorithm: String) throws {
        guard let data = Data(base64Encoded: base64Encoded) else {
            throw CryptoError.invalidBase64
        }
        self.ciphertext = data
        self.algorithm = algorithm
    }
}

enum CryptoError: LocalizedError {
    case encryptionFailed
    case decryptionFailed
    case keyGenerationFailed
    case keyNotFound
    case invalidBase64

    var errorDescription: String? {
        switch self {
        case .encryptionFailed:
            return "Failed to encrypt data"
        case .decryptionFailed:
            return "Failed to decrypt data"
        case .keyGenerationFailed:
            return "Failed to generate encryption key"
        case .keyNotFound:
            return "Encryption key not found"
        case .invalidBase64:
            return "Invalid base64 encoded data"
        }
    }
}
