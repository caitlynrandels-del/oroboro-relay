// node tests/pipeline.test.js  — deterministic checks for the conjunctive pipeline
const assert = require('assert');
const { OroboroPipeline, OroboroRelationalSim } = require('../oroboro-core.js');

function build() {
  const p = new OroboroPipeline();
  p.nexus.register('ZAB', { status: 'INDEPENDENT', flights: 42 });
  p.nexus.register('ZNY', { status: 'INDEPENDENT', flights: 74 });
  p.nexus.register('ZLA', { status: 'INDEPENDENT', flights: 61 });
  return p;
}

// 1) No randomness: same inputs give identical summaries
const a = build(), b = build();
const radio = ['ZNY routine handoff', 'ZAB alert degraded link', 'mayday ZLA'];
const copies = { ZNY: { status: 'INDEPENDENT', flights: 90 } };
const sa = a.tick(radio, copies), sb = b.tick(radio, copies);
for (const k of ['pulse', 'pressure', 'limit', 'coherent', 'isolated', 'levyTotal']) assert.deepStrictEqual(sa[k], sb[k], k);

// 2) Levy reads Transcriber entries (2 critical x10 + 1 routine x1 = 21)
assert.strictEqual(sa.pulse, 21);
// 3) Levy pulse above rest load raises pressure, which tightens the coherence limit
assert.ok(sa.pressure > 0 && sa.limit < 0.2);
// 4) Delta is real: ZNY local 90 vs whole 74 drifts and gets isolated by mesh consensus
assert.strictEqual(sa.isolated, 'ZNY');
assert.strictEqual(a.nexus.registry.get('ZNY').status, 'ISOLATED');
// 5) Matching copies give zero delta and stay coherent
const c = build(); const sc = c.tick([], {});
assert.strictEqual(sc.coherent, true); assert.strictEqual(sc.isolated, null);
assert.strictEqual(OroboroRelationalSim.computeDelta({ flights: 10, status: 'x' }, { flights: 10, status: 'x' }), 0);
console.log('pipeline tests passed');
