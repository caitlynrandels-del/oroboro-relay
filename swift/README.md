# Oroboro Relay – SwiftUI App (Apple)

Full conversion of the web prototype (`index.html` + `oroboro-core.js`) into a native SwiftUI app.

## What it does
- Lists all major ARTCCs (Air Route Traffic Control Centers) as independent sectors
- Shows a reconciled traffic picture with sample flights
- **Simulate Router Flood** — marks random sectors degraded and introduces inconsistent data (mirrors the 13 Nov 2026 FAA event)
- **Force Reconciliation** — restores coherence via delta reconciliation
- **Isolate Active Sector** — continues local processing while mesh waits
- Live Dictator transcript with critical messages weighted by Levy
- Nexus telemetry (delta count, levy weight, last reconcile)
- Mesh status visualization

## Platforms
- visionOS (primary, spatial-friendly layout)
- iOS 17+
- macOS 14+

## How to open in Xcode
1. Download the `swift` folder
2. Open `Package.swift` in Xcode
3. Or create a new VisionOS / Multiplatform App and replace the content with `OroboroRelayApp.swift`

The app is self-contained for easy use.

## Core Framework (translated to Swift)
- `OroboroNexus` — registry + independent state
- `OroboroTranscriber` — chronicles + critical detection
- `OroboroRelationalSim` — process independent + recombine

This preserves the state-reduction / relational simulation approach from the original Oroboro Relay prototype.
