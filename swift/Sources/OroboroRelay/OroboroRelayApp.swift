// Oroboro Relay – SwiftUI App for Apple (VisionOS / iOS / macOS)
// Full conversion of the web prototype + core framework
// Independent sector processing + delta reconciliation for ATC resilience

import SwiftUI

// MARK: - Core Oroboro Types (translated from oroboro-core.js)

enum SectorStatus: String, Codable {
    case ok = "INDEPENDENT"
    case overloaded = "DEGRADED"
    case isolated = "ISOLATED"
}

struct Sector: Identifiable, Equatable {
    let id: String
    let name: String
    var status: SectorStatus = .ok
    var flights: Int
}

struct Flight: Identifiable {
    let id = UUID()
    let callsign: String
    let altitude: String
    let heading: Int
    var status: String = "ok"
}

struct TranscriptEntry: Identifiable {
    let id = UUID()
    let time: Date
    let text: String
    let isCritical: Bool
}

// MARK: - Oroboro Framework Classes

class OroboroNexus: ObservableObject {
    @Published var registry: [String: Sector] = [:]
    var archive: [(String, Date)] = []
    var metrics = (deltas: 0, reconciliations: 0, isolations: 0)
    
    func register(_ sector: Sector) {
        registry[sector.id] = sector
        archive.append((sector.id, Date()))
    }
    
    func getIndependentState(for sectorId: String) -> Sector? {
        registry[sectorId]
    }
}

class OroboroTranscriber: ObservableObject {
    @Published var chronicles: [TranscriptEntry] = []
    var totalLevyWeight: Int = 0
    
    func ingest(_ text: String, critical: Bool = false) -> TranscriptEntry {
        let entry = TranscriptEntry(time: Date(), text: text, isCritical: critical)
        chronicles.insert(entry, at: 0)
        if critical { totalLevyWeight += 5 }
        if chronicles.count > 50 { chronicles.removeLast() }
        return entry
    }
}

class OroboroRelationalSim {
    func processIndependent(sector: Sector) -> (local: Sector, delta: Double) {
        (sector, Double.random(in: 0...0.15))
    }
    
    func recombine(_ outcomes: [(local: Sector, delta: Double)]) -> Bool {
        outcomes.allSatisfy { $0.delta < 0.2 }
    }
}

// MARK: - View Model

@MainActor
class OroboroRelayViewModel: ObservableObject {
    @Published var sectors: [Sector] = [
        Sector(id: "ZAB", name: "Albuquerque Center", flights: 42),
        Sector(id: "ZAU", name: "Chicago Center", flights: 68),
        Sector(id: "ZBW", name: "Boston Center", flights: 31),
        Sector(id: "ZDC", name: "Washington Center", flights: 55),
        Sector(id: "ZID", name: "Indianapolis Center", flights: 47),
        Sector(id: "ZJX", name: "Jacksonville Center", flights: 29),
        Sector(id: "ZKC", name: "Kansas City Center", flights: 38),
        Sector(id: "ZLA", name: "Los Angeles Center", flights: 61),
        Sector(id: "ZME", name: "Memphis Center", flights: 33),
        Sector(id: "ZMP", name: "Minneapolis Center", flights: 27),
        Sector(id: "ZNY", name: "New York Center", flights: 74),
        Sector(id: "ZOA", name: "Oakland Center", flights: 44),
        Sector(id: "ZOB", name: "Cleveland Center", flights: 36),
        Sector(id: "ZSE", name: "Seattle Center", flights: 22),
        Sector(id: "ZTL", name: "Atlanta Center", flights: 59)
    ]
    
    @Published var activeSector: Sector?
    @Published var flights: [Flight] = []
    @Published var globalStatus: String = "SYSTEM COHERENT"
    @Published var isCoherent: Bool = true
    @Published var deltaCount: Int = 0
    @Published var levyWeight: Int = 0
    @Published var lastReconcile: String = "—"
    @Published var transcript: [TranscriptEntry] = []
    
    let nexus = OroboroNexus()
    let transcriber = OroboroTranscriber()
    let sim = OroboroRelationalSim()
    
    private var timer: Timer?
    
    init() {
        sectors.forEach { nexus.register($0) }
        generateFlights()
        addTranscript("Oroboro Relay online. Independent sector processing active.")
        addTranscript("Dictator ready. Chronicle ledger open. Genesis origin confirmed.")
        startLiveSimulation()
    }
    
    func selectSector(_ sector: Sector) {
        activeSector = sector
        generateFlights()
        addTranscript("Sector \(sector.id) selected. Local state reduction active.")
    }
    
    func generateFlights() {
        let count = activeSector == nil ? 12 : 6
        let airlines = ["AAL", "DAL", "UAL", "SWA", "JBU", "ASA"]
        flights = (0..<count).map { i in
            Flight(
                callsign: airlines[i % airlines.count] + String(Int.random(in: 100...999)),
                altitude: "FL\(Int.random(in: 280...400))",
                heading: Int.random(in: 0...359),
                status: (!isCoherent && Double.random(in: 0...1) > 0.6) ? "INCONSISTENT" : "ok"
            )
        }
    }
    
    func simulateRouterFlood() {
        isCoherent = false
        globalStatus = "DEGRADED — ROUTER FLOOD DETECTED"
        deltaCount += 47
        for i in sectors.indices where Bool.random() {
            sectors[i].status = .overloaded
        }
        generateFlights()
        addTranscript("ALERT: Router flood detected. Inconsistent data on multiple sectors. Independent processing continues.", critical: true)
        addTranscript("Oroboro Nexus: Isolating degraded nodes. Mesh consensus active.")
    }
    
    func reconcile() {
        isCoherent = true
        globalStatus = "SYSTEM COHERENT"
        deltaCount = 0
        lastReconcile = Date().formatted(date: .omitted, time: .standard)
        for i in sectors.indices {
            sectors[i].status = .ok
        }
        generateFlights()
        addTranscript("Delta reconciliation complete. Observable result matches whole-system processing.")
        addTranscript("All independent sectors recombined. Coherence restored.")
    }
    
    func isolateActiveSector() {
        guard let sector = activeSector else { return }
        if let idx = sectors.firstIndex(where: { $0.id == sector.id }) {
            sectors[idx].status = .isolated
        }
        addTranscript("Sector \(sector.id) isolated. Local state continues. Mesh will reconcile on reconnect.")
    }
    
    func addTranscript(_ text: String, critical: Bool = false) {
        let entry = transcriber.ingest(text, critical: critical)
        transcript.insert(entry, at: 0)
        levyWeight = transcriber.totalLevyWeight
    }
    
    private func startLiveSimulation() {
        timer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            if Double.random(in: 0...1) > 0.7 {
                let msgs = [
                    "AAL1234 climb and maintain FL350",
                    "UAL456 radar contact",
                    "DAL789 turn left heading 270",
                    "SWA321 contact center on 132.45",
                    "JBU555 cleared direct"
                ]
                Task { @MainActor in
                    self.addTranscript(msgs.randomElement()!)
                }
            }
        }
    }
    
    deinit { timer?.invalidate() }
}

// MARK: - Main View

struct OroboroRelayView: View {
    @StateObject private var vm = OroboroRelayViewModel()
    
    var body: some View {
        NavigationSplitView {
            // Sectors sidebar
            List(vm.sectors) { sector in
                Button {
                    vm.selectSector(sector)
                } label: {
                    HStack {
                        Circle()
                            .fill(statusColor(sector.status))
                            .frame(width: 10, height: 10)
                        VStack(alignment: .leading) {
                            Text(sector.id).font(.headline)
                            Text(sector.name).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(sector.flights)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.plain)
                .listRowBackground(
                    vm.activeSector?.id == sector.id ? Color.accentColor.opacity(0.15) : Color.clear
                )
            }
            .navigationTitle("Independent Sectors")
            .toolbar {
                ToolbarItem(placement: .bottomBar) {
                    Text(vm.globalStatus)
                        .font(.caption)
                        .foregroundStyle(vm.isCoherent ? .green : .orange)
                }
            }
        } content: {
            // Main traffic picture
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(vm.activeSector.map { "Reconciled Picture — \($0.id)" } ?? "Reconciled Picture — All Sectors")
                        .font(.title2)
                    Spacer()
                    Text(vm.globalStatus)
                        .font(.headline)
                        .foregroundStyle(vm.isCoherent ? .green : .orange)
                }
                
                List(vm.flights) { flight in
                    HStack {
                        Text(flight.callsign).font(.system(.body, design: .monospaced))
                        Spacer()
                        Text("\(flight.altitude) • \(flight.heading)°")
                        Text(flight.status)
                            .foregroundStyle(flight.status == "ok" ? .green : .orange)
                    }
                }
                
                HStack {
                    Button("Simulate Router Flood") { vm.simulateRouterFlood() }
                        .buttonStyle(.borderedProminent)
                    Button("Force Reconciliation") { vm.reconcile() }
                    Button("Isolate Active") { vm.isolateActiveSector() }
                        .disabled(vm.activeSector == nil)
                }
                .buttonStyle(.bordered)
                
                // Mesh status
                HStack(spacing: 8) {
                    ForEach(vm.sectors.prefix(8)) { sector in
                        Circle()
                            .fill(statusColor(sector.status))
                            .frame(width: 36, height: 36)
                            .overlay(Text(String(sector.id.dropFirst())).font(.caption2))
                    }
                }
                .padding(.top, 8)
            }
            .padding()
            .navigationTitle("Traffic Picture")
        } detail: {
            // Telemetry + Transcript
            VStack(alignment: .leading, spacing: 16) {
                GroupBox("Nexus Telemetry") {
                    VStack(alignment: .leading, spacing: 8) {
                        LabeledContent("Delta count", value: "\(vm.deltaCount)")
                        LabeledContent("Levy weight (critical)", value: "\(vm.levyWeight)")
                        LabeledContent("Last reconciliation", value: vm.lastReconcile)
                        Text("Independent parts processed locally. Observable result matches whole-system processing via delta reconciliation.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)
                    }
                }
                
                GroupBox("Oroboro Dictator • Live Transcription") {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 6) {
                            ForEach(vm.transcript) { entry in
                                HStack(alignment: .top) {
                                    Text(entry.time.formatted(date: .omitted, time: .standard))
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                        .frame(width: 70, alignment: .leading)
                                    Text(entry.text)
                                        .font(.system(.caption, design: .monospaced))
                                        .foregroundStyle(entry.isCritical ? .yellow : .primary)
                                }
                            }
                        }
                    }
                    .frame(maxHeight: .infinity)
                }
            }
            .padding()
        }
    }
    
    private func statusColor(_ status: SectorStatus) -> Color {
        switch status {
        case .ok: return .green
        case .overloaded: return .orange
        case .isolated: return .gray
        }
    }
}

#Preview {
    OroboroRelayView()
}
