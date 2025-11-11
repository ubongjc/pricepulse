# PricePulse iOS

Native iOS application for PricePulse - track grocery inflation, compare prices, and save money on your everyday purchases.

## Tech Stack

- **Framework**: SwiftUI
- **Minimum iOS**: 17.0+
- **Architecture**: MVVM with Combine
- **Networking**: URLSession with async/await
- **Security**: CryptoKit for client-side encryption
- **Camera**: AVFoundation + Vision (for OCR)
- **Authentication**: WebAuthn/Passkeys via AuthenticationServices

## Features

- 🔐 **Passkey Authentication**: Secure biometric authentication
- 📸 **Receipt Scanning**: Camera-based receipt capture
- 🔒 **End-to-End Encryption**: Client-side encryption using AES-GCM-256
- 📊 **Price Tracking**: Monitor your grocery spending over time
- 🏪 **Local Price Comparison**: Compare with neighborhood averages
- 💰 **Smart Suggestions**: Get personalized money-saving recommendations
- 🔄 **Offline Support**: View receipts even without connectivity
- 📱 **Native iOS Experience**: SwiftUI-powered modern interface

## Project Structure

```
PricePulse/
├── App/                           # Application entry point
│   ├── PricePulseApp.swift       # App definition
│   └── ContentView.swift         # Root view with navigation
├── Features/                      # Feature modules
│   ├── Auth/                     # Authentication
│   │   ├── AuthManager.swift
│   │   └── SignInView.swift
│   ├── Receipt/                  # Receipt management
│   │   ├── ReceiptCaptureView.swift
│   │   ├── ReceiptCaptureViewModel.swift
│   │   ├── ReceiptListView.swift
│   │   └── ReceiptListViewModel.swift
│   └── Settings/                 # User settings
│       ├── SettingsView.swift
│       └── SettingsViewModel.swift
├── Modules/                       # Shared modules
│   ├── Networking/               # API client
│   │   ├── NetworkManager.swift
│   │   └── APIService.swift
│   ├── Crypto/                   # Encryption
│   │   ├── CryptoManager.swift
│   │   └── KeychainManager.swift
│   └── Storage/                  # Local persistence
└── Models/                        # Data models
    ├── Receipt.swift
    └── User.swift
```

## Architecture

### Modular Design

The app is organized into feature modules and shared modules:

- **Features**: Self-contained feature implementations with views and view models
- **Modules**: Reusable functionality (networking, crypto, storage)
- **Models**: Shared data structures

### Security

#### Client-Side Encryption

Receipt images are encrypted on-device before upload:

```swift
// Generate unique key per receipt
let key = cryptoManager.generateEncryptionKey()

// Encrypt image data
let encrypted = try cryptoManager.encrypt(data: imageData, using: key)

// Store key securely in keychain
try cryptoManager.storeKey(key, identifier: keyIdentifier)
```

Keys are stored in the device keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` protection.

#### Passkey Authentication

Uses native iOS AuthenticationServices for WebAuthn:

```swift
// Sign in with passkey
await authManager.signInWithPasskey()

// Create new passkey during registration
await authManager.signUpWithPasskey(email: email)
```

## Getting Started

### Prerequisites

- Xcode 15.0+
- iOS 17.0+ device or simulator
- PricePulse backend running locally or deployed

### Installation

1. Open the project in Xcode:

```bash
cd pricepulse_ios
open Package.swift
```

2. Configure the backend URL in `NetworkManager.swift`:

```swift
init(baseURL: String = "https://your-api-url.com") {
    // or http://localhost:3000 for local development
}
```

3. Build and run the project in Xcode (Cmd+R)

### Camera Permissions

Add the following to your Info.plist:

```xml
<key>NSCameraUsageDescription</key>
<string>PricePulse needs camera access to scan receipts</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>PricePulse needs photo library access to import receipt images</string>
```

## Development

### Running Tests

```bash
swift test
```

### Code Style

- Follow Swift API Design Guidelines
- Use SwiftLint for consistent formatting
- Document public APIs with DocC-style comments

### Common Tasks

#### Adding a New Feature

1. Create feature module in `Features/`
2. Implement view and view model
3. Add navigation in `ContentView.swift`
4. Update API service if needed

#### Adding a New API Endpoint

1. Add method to `APIService.swift`
2. Define request/response models in `Models/`
3. Use from view model with async/await

## Security Best Practices

### Encryption

- ✅ All receipt images encrypted with AES-GCM-256
- ✅ Unique key per receipt stored in keychain
- ✅ Server only receives encrypted ciphertext
- ✅ Decryption keys never leave the device

### Authentication

- ✅ Passkeys for secure biometric auth
- ✅ Auth tokens stored securely in keychain
- ✅ Automatic token refresh
- ✅ Secure credential management

### Networking

- ✅ HTTPS only (HTTP blocked in production)
- ✅ Certificate pinning (recommended for production)
- ✅ Request timeouts configured
- ✅ Sensitive data not logged

## API Integration

The app communicates with the PricePulse web backend:

### Authentication Flow

1. User initiates sign-in/sign-up
2. App requests challenge from backend
3. iOS creates/uses passkey credential
4. Backend verifies and returns JWT token
5. Token stored securely in keychain

### Receipt Upload Flow

1. User captures receipt image
2. Image encrypted on-device with unique key
3. Encrypted data uploaded to R2 via backend
4. Receipt metadata sent to backend API
5. Backend processes and stores (never sees plaintext)

## Privacy & GDPR Compliance

- **Data Minimization**: Only collect necessary data
- **Encryption**: Client-side encryption for sensitive data
- **User Control**: Export and delete data from settings
- **Transparency**: Clear privacy notices and consent
- **Data Sharing**: User-controlled sharing preferences

## Production Considerations

Before releasing:

- [ ] Enable certificate pinning
- [ ] Configure proper API base URL
- [ ] Set up crash reporting (Sentry)
- [ ] Add analytics (privacy-respecting)
- [ ] Implement proper error handling
- [ ] Add offline data sync
- [ ] Test passkey flows thoroughly
- [ ] Review App Store privacy labels
- [ ] Conduct security audit

## License

Copyright © 2024 PricePulse. All rights reserved.
