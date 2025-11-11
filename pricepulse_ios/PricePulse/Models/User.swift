import Foundation

// MARK: - User Models

struct User: Codable, Identifiable {
    let id: String
    let clerkId: String
    let email: String
    let firstName: String?
    let lastName: String?
    let role: UserRole
    let dataSharingPreference: DataSharingPreference
    let stripeCustomerId: String?
    let subscriptionStatus: String?
    let subscriptionEndDate: Date?
    let createdAt: Date
    let updatedAt: Date

    var displayName: String {
        if let firstName = firstName, let lastName = lastName {
            return "\(firstName) \(lastName)"
        } else if let firstName = firstName {
            return firstName
        } else {
            return email
        }
    }

    var isPremium: Bool {
        role == .premium || role == .admin
    }
}

enum UserRole: String, Codable {
    case user = "USER"
    case premium = "PREMIUM"
    case admin = "ADMIN"
}

enum DataSharingPreference: String, Codable {
    case none = "NONE"
    case anonymous = "ANONYMOUS"
    case full = "FULL"
}

// MARK: - Request Models

struct UserUpdateRequest: Codable {
    let firstName: String?
    let lastName: String?
    let dataSharingPreference: DataSharingPreference?
}
