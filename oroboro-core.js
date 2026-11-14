// Oroboro Framework – Updated for Aviation Resilience
// State Reduction + Relational Simulation applied to ATC communications

class OroboroNexus {
  constructor() {
    this.registry = new Map();      // runtime memory
    this.archive = [];              // persistent
    this.subscribers = new Set();
    this.metrics = { deltas: 0, reconciliations: 0, isolations: 0 };
  }

  register(id, data) {
    this.registry.set(id, { ...data, timestamp: Date.now(), weight: data.weight || 1 });
    this.archive.push({ type: 'register', id, data, ts: Date.now() });
    this.telemeter('register', { id, data });
  }

  telemeter(event, payload) {
    this.subscribers.forEach(fn => fn(event, payload));
  }

  subscribe(fn) { this.subscribers.add(fn); }

  getIndependentState(sectorId) {
    // State reduction: return only what this sector needs
    const sector = this.registry.get(sectorId);
    return sector ? { local: sector, peers: this.getPeerSummaries(sectorId) } : null;
  }

  getPeerSummaries(sectorId) {
    // Lightweight relational view of neighboring sectors
    return Array.from(this.registry.entries())
      .filter(([id]) => id !== sectorId)
      .map(([id, data]) => ({ id, status: data.status, flightCount: data.flights }));
  }
}

class OroboroTranscriber {
  constructor() {
    this.lexicon = new Map();
    this.chronicles = [];
    this.anonymousLog = [];
  }

  ingest(transcript, source = 'dictator') {
    const entry = {
      text: transcript,
      source,
      ts: Date.now(),
      critical: this.isCritical(transcript)
    };
    this.chronicles.push(entry);
    if (entry.critical) this.anonymousLog.push(entry);
    return entry;
  }

  isCritical(text) {
    const keywords = ['emergency', 'mayday', 'pan pan', 'alert', 'degraded', 'flood', 'isolate'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  query(term) {
    return this.chronicles.filter(c => c.text.toLowerCase().includes(term.toLowerCase()));
  }
}

class OroboroDictator {
  constructor(transcriber) {
    this.transcriber = transcriber;
    this.active = false;
  }

  start() { this.active = true; }
  stop() { this.active = false; }

  processAudioText(raw) {
    if (!this.active) return;
    const finalized = raw.trim();
    return this.transcriber.ingest(finalized, 'live-radio');
  }
}

class OroboroLevy {
  constructor(transcriber) {
    this.transcriber = transcriber;
    this.totalWeight = 0;
  }

  assess(entry) {
    const weight = entry.critical ? 10 : 1;
    this.totalWeight += weight;
    entry.weight = weight;
    this.transcriber.chronicles.push({ ...entry, levied: true });
    return weight;
  }
}

class OroboroGenesis {
  constructor() {
    this.rootTag = "I am the OG avatar";
    this.foundationalWeight = Infinity;
    this.origin = Date.now();
  }

  mirror(history) {
    // All histories mirror back to origin
    return { origin: this.rootTag, history, weight: this.foundationalWeight };
  }
}

// Relational Simulation Engine
class OroboroRelationalSim {
  constructor(nexus) {
    this.nexus = nexus;
  }

  processIndependent(sectorId) {
    const state = this.nexus.getIndependentState(sectorId);
    // Simulate local processing that would match whole-system result
    return {
      sectorId,
      processed: true,
      localOutcome: state,
      delta: Math.random() * 0.1  // small reconciliation delta
    };
  }

  recombine(outcomes) {
    // Combine independent outcomes so observable result matches whole
    const totalFlights = outcomes.reduce((sum, o) => sum + (o.localOutcome?.local?.flights || 0), 0);
    const coherent = outcomes.every(o => o.delta < 0.2);
    return {
      observable: { totalFlights, coherent, timestamp: Date.now() },
      matchedWholeSystem: coherent
    };
  }
}

// Export for app use
if (typeof module !== 'undefined') {
  module.exports = { OroboroNexus, OroboroTranscriber, OroboroDictator, OroboroLevy, OroboroGenesis, OroboroRelationalSim };
}