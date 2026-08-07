const VALUE_ALIASES = new Map([
  ["honored guest", "guests"],
  ["honoured guest", "guests"],
  ["honored guests", "guests"],
  ["honoured guests", "guests"],
  ["guest", "guests"],
  ["guests", "guests"],
  ["chairceos", "chairpersons"],
  ["chairceo", "chairpersons"],
  ["chairperson", "chairpersons"],
  ["chairpersons", "chairpersons"],
  ["chairman", "chairpersons"],
  ["chairwoman", "chairpersons"],
  // NOTE: do not alias "Tz Family 2" to a generic "family" value here.
  // Preserve literal cluster names so an import mentioning "Tz Family 2"
  // will resolve to a cluster with that exact name (or create it if missing).
  ["ruach clergy", "clergy"],
  // Preserve literal cluster names for these special groups so they do not
  // collapse into the generic Guests cluster.
  // ["isayas kenyan guests", "guests"],
  // ["dar es salaam guests", "guests"],
  // ["children dar es salaam", "children"],
  // ["isayas china friends", "guests"],
  // ["usa guests", "guests"],
  // ["charls friends", "guests"],
  // ["family friend", "guests"],
  // ["family friends", "guests"],
]);

function normalizeClusterName(rawValue) {
  if (rawValue === null || rawValue === undefined) return "";

  const trimmed = String(rawValue).trim();
  if (!trimmed) return "";

  const normalizedSource = trimmed
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['‘’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token)
    .join(" ")
    .trim();

  const aliasMatch = VALUE_ALIASES.get(normalizedSource);
  if (aliasMatch) return aliasMatch;

  return normalizedSource;
}

function getClusterAliases(rawValue) {
  const normalizedValue = normalizeClusterName(rawValue);
  if (!normalizedValue) return [];

  const aliases = [normalizedValue];
  if (normalizedValue.endsWith("s") && normalizedValue.length > 3) {
    aliases.push(normalizedValue.slice(0, -1));
  } else if (!normalizedValue.endsWith("s") && normalizedValue.length > 3) {
    aliases.push(`${normalizedValue}s`);
  }

  return [...new Set(aliases.filter(Boolean))];
}

function buildClusterLookup(clusters = []) {
  const lookup = new Map();

  for (const cluster of clusters) {
    if (!cluster?.name) continue;

    const aliases = getClusterAliases(cluster.name);
    for (const alias of aliases) {
      lookup.set(alias, cluster);
    }

    const legacyClean = String(cluster.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (legacyClean) {
      lookup.set(legacyClean, cluster);
    }
  }

  return lookup;
}

function resolveClusterMatch(rawValue, clusterLookup, fallbackCluster = null) {
  const normalizedRaw = normalizeClusterName(rawValue);
  if (!normalizedRaw) {
    return {
      cluster: null,
      matched: false,
      normalizedValue: "",
      rawValue,
      fallbackCluster,
    };
  }

  const fallbackAliases = [
    normalizedRaw,
    normalizedRaw.replace(/\s+/g, ""),
    ...getClusterAliases(normalizedRaw),
  ];
  for (const alias of fallbackAliases) {
    const matchedCluster = clusterLookup.get(alias);
    if (matchedCluster) {
      return {
        cluster: matchedCluster,
        matched: true,
        normalizedValue: alias,
        rawValue,
        fallbackCluster,
      };
    }
  }

  // Fallback: try to find a cluster whose normalized form matches or
  // contains the normalized raw value. Avoid matching raw values to very
  // generic cluster names such as "guests" unless the normalized values
  // are exactly equal.
  const GENERIC_CLUSTER_NAMES = new Set(["guest", "guests", "people", "attendees"]);

  for (const cluster of clusterLookup.values()) {
    try {
      const clusterNormalized = normalizeClusterName(cluster.name);
      if (!clusterNormalized) continue;
      if (clusterNormalized === normalizedRaw) {
        return {
          cluster,
          matched: true,
          normalizedValue: clusterNormalized,
          rawValue,
          fallbackCluster,
        };
      }
      if (
        clusterNormalized.includes(normalizedRaw) &&
        clusterNormalized.length > normalizedRaw.length + 3
      ) {
        return {
          cluster,
          matched: true,
          normalizedValue: clusterNormalized,
          rawValue,
          fallbackCluster,
        };
      }
      if (
        normalizedRaw.includes(clusterNormalized) &&
        clusterNormalized.length > 5 &&
        !GENERIC_CLUSTER_NAMES.has(clusterNormalized)
      ) {
        return {
          cluster,
          matched: true,
          normalizedValue: clusterNormalized,
          rawValue,
          fallbackCluster,
        };
      }
    } catch (e) {
      // ignore any normalization errors for odd cluster names
    }
  }

  return {
    cluster: null,
    matched: false,
    normalizedValue: normalizedRaw,
    rawValue,
    fallbackCluster,
  };
}

export { normalizeClusterName, buildClusterLookup, resolveClusterMatch };
