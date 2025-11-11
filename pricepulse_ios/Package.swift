// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PricePulse",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "PricePulse",
            targets: ["PricePulse"]
        )
    ],
    dependencies: [
        // Add package dependencies here
    ],
    targets: [
        .target(
            name: "PricePulse",
            dependencies: [],
            path: "PricePulse"
        ),
        .testTarget(
            name: "PricePulseTests",
            dependencies: ["PricePulse"]
        )
    ]
)
