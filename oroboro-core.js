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

  // Deterministic delta reconciliation (replaces the old Math.random() * 0.1 stub).
  // delta = how far a part's reduced local copy has drifted from the Nexus registry
  // (the whole-system record): relative flight-count gap + 0.1 if status disagrees.
  static computeDelta(local, whole) {
    if (!local || !whole) return 0;
    const lf = local.flights || 0, wf = whole.flights || 0;
    const gap = Math.abs(lf - wf) / Math.max(1, wf);
    return gap + (local.status !== whole.status ? 0.1 : 0);
  }

  processIndependent(sectorId, localCopy) {
    const state = this.nexus.getIndependentState(sectorId);
    const whole = this.nexus.registry.get(sectorId);
    const local = localCopy || (state ? state.local : null);
    return {
      sectorId,
      processed: true,
      localOutcome: state ? { ...state, local } : state,
      delta: OroboroRelationalSim.computeDelta(local, whole)
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

// Conjunctive pipeline: every component on ONE loop, each feeding the next.
//   Dictator -> Transcriber -> Levy -> Nexus (register + telemeter)
//   -> RelationalSim parts (state reduction, deterministic delta)
//   -> mesh consensus (isolate the most-drifted part when incoherent)
//   -> damped pressure from Levy + delta (homeostasis) -> next tick's criticality gate
//   -> Genesis mirror closes the history back to origin.
class OroboroPipeline {
  constructor({ alpha = 0.35, gain = 1.0, restLevy = 10, pressureLimit = 0.5 } = {}) {
    this.nexus = new OroboroNexus();
    this.transcriber = new OroboroTranscriber();
    this.dictator = new OroboroDictator(this.transcriber);
    this.levy = new OroboroLevy(this.transcriber);
    this.genesis = new OroboroGenesis();
    this.sim = new OroboroRelationalSim(this.nexus);
    this.alpha = alpha; this.gain = gain; this.restLevy = restLevy; this.pressureLimit = pressureLimit;
    this.pressure = 0;
    this.tickCount = 0;
    this.dictator.start();
    this.nexus.register('genesis', { status: 'origin', flights: 0, mirror: this.genesis.mirror([]) });
  }

  // radio: array of raw transcript strings; localCopies: { sectorId: {flights, status} }
  tick(radio = [], localCopies = {}) {
    this.tickCount += 1;
    // 1) Dictator -> Transcriber -> Levy
    let pulse = 0;
    for (const raw of radio) {
      const entry = this.dictator.processAudioText(raw);
      if (entry) pulse += this.levy.assess(entry);
    }
    // 2) Damped pressure (delta reconciliation of the Levy pulse vs rest load)
    const spike = Math.max(0, (pulse - this.restLevy) / Math.max(1, this.restLevy));
    this.pressure = (1 - this.alpha) * this.pressure + this.alpha * this.gain * spike;
    // 3) Parts process independently against the Nexus whole-system record
    const ids = Array.from(this.nexus.registry.keys()).filter(id => id !== 'genesis');
    const outcomes = ids.map(id => this.sim.processIndependent(id, localCopies[id]));
    this.nexus.metrics.deltas += outcomes.length;
    // 4) Coherence threshold tightens under pressure (homeostasis feeding the gate)
    const limit = Math.max(0.05, 0.2 - 0.15 * Math.min(1, this.pressure / this.pressureLimit));
    const coherent = outcomes.every(o => o.delta < limit);
    // 5) Mesh consensus: isolate the most-drifted part if incoherent; others continue
    let isolated = null;
    if (!coherent && outcomes.length) {
      const worst = outcomes.reduce((a, b) => (b.delta > a.delta ? b : a));
      isolated = worst.sectorId;
      const rec = this.nexus.registry.get(isolated);
      if (rec) this.nexus.registry.set(isolated, { ...rec, status: 'ISOLATED' });
      this.nexus.metrics.isolations += 1;
      this.transcriber.ingest(`isolate ${isolated} (delta ${worst.delta.toFixed(3)})`, 'pipeline');
    }
    const kept = outcomes.filter(o => o.sectorId !== isolated);
    const recombined = this.sim.recombine(kept);
    this.nexus.metrics.reconciliations += 1;
    // 6) Nexus telemetry + Genesis closure
    const mirror = this.genesis.mirror(this.transcriber.chronicles.length);
    const summary = { tick: this.tickCount, pulse, pressure: this.pressure, limit, coherent, isolated,
                      observable: recombined.observable, levyTotal: this.levy.totalWeight, genesis: mirror.origin };
    this.nexus.telemeter('tick', summary);
    this.nexus.archive.push({ type: 'tick', ...summary });
    return summary;
  }
}

// Export for app use
if (typeof module !== 'undefined') {
  module.exports = { OroboroNexus, OroboroTranscriber, OroboroDictator, OroboroLevy, OroboroGenesis, OroboroRelationalSim, OroboroPipeline };
}