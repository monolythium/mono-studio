const HEX = "0123456789abcdef";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)])
    );
  }

  return value;
}

function toHex32(value: number): string {
  let out = "";
  let next = value >>> 0;
  for (let index = 0; index < 8; index += 1) {
    out = HEX[next & 15] + out;
    next >>>= 4;
  }
  return out;
}

export function stableText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(sortValue(value));
}

export function monoHash(value: unknown): string {
  const text = stableText(value);
  const seeds = [2166136261, 2246822519, 3266489917, 668265263, 374761393, 1274126177, 1597334677, 3812015801];

  for (let seedIndex = 0; seedIndex < seeds.length; seedIndex += 1) {
    let hash = seeds[seedIndex] ?? 0;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index) + seedIndex * 97;
      hash = Math.imul(hash, 16777619);
      hash ^= hash >>> 13;
    }
    seeds[seedIndex] = hash >>> 0;
  }

  return seeds.map(toHex32).join("").slice(0, 64);
}

export function shortHash(value: unknown, length = 12): string {
  return monoHash(value).slice(0, length);
}
