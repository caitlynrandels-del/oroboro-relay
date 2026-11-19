// Package.swift for Oroboro Relay Swift App
//swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "OroboroRelay",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .visionOS(.v1)
    ],
    products: [
        .library(name: "OroboroRelay", targets: ["OroboroRelay"])
    ],
    targets: [
        .target(
            name: "OroboroRelay",
            path: "Sources/OroboroRelay"
        )
    ]
)
