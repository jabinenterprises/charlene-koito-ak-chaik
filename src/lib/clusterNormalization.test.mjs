import assert from "node:assert/strict";
import { buildClusterLookup, resolveClusterMatch } from "./clusterNormalization.mjs";

const clusters = [
  { id: "1", name: "North Rift" },
  { id: "2", name: "Senators" },
  { id: "3", name: "Chairpersons" },
  { id: "4", name: "Guests" },
  { id: "5", name: "Tz Family 2" },
  { id: "6", name: "Clergy" },
  { id: "7", name: "Children" },
  { id: "8", name: "Isaya's Kenyan Guests" },
  { id: "9", name: "Dar es Salaam Guests" },
  { id: "10", name: "Family Friends" },
];

const lookup = buildClusterLookup(clusters);
const fallbackCluster = clusters[2];

const cases = [
  ["North Rift", "north rift", "1"],
  ["north-rift", "north rift", "1"],
  ["COASTAL REGION", "coastal region", null],
  ["Honored Guests", "guests", "4"],
  ["Senator", "senator", "2"],
  ["Senators", "senators", "2"],
  ["Chairceos", "chairpersons", "3"],
  ["Tz Family 2", "tz family 2", "5"],
  ["RUACH Clergy", "clergy", "6"],
  ["Isaya's Kenyan Guests", "isayas kenyan guests", "8"],
  ["Dar es Salaam Guests", "dar es salaam guests", "9"],
  ["Family Friend", "family friend", "10"],
  ["Family Friends", "family friends", "10"],
  ["Children (Dar es Salaam)", "children", "7"],
  ["Isaya's China Friends", "isayas china friends", null],
  ["USA Guests", "usa guests", null],
  ["Charl's friends", "charls friends", null],
  ["Unknown Cluster", "unknown cluster", null],
];

for (const [rawValue, expectedNormalized, expectedId] of cases) {
  const result = resolveClusterMatch(rawValue, lookup, fallbackCluster);
  assert.equal(result.normalizedValue, expectedNormalized, `${rawValue} normalized incorrectly`);
  if (expectedId) {
    assert.equal(result.cluster?.id, expectedId, `${rawValue} should match ${expectedId}`);
    assert.equal(result.matched, true, `${rawValue} should be marked as matched`);
  } else {
    assert.equal(result.matched, false, `${rawValue} should be unmatched`);
    assert.equal(result.cluster, null, `${rawValue} should not return a matched cluster`);
    assert.equal(result.fallbackCluster?.id, fallbackCluster.id, `${rawValue} should preserve the fallback cluster`);
  }
}

console.log("cluster normalization tests passed");
