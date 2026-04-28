function xmur3(input) {
  let hash = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return function next() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeSeed(seedInput) {
  if (seedInput === undefined || seedInput === null || seedInput === "") {
    return `${Date.now()}`;
  }
  return `${seedInput}`.trim();
}

export function createSeededRandom(seedInput) {
  const normalizedSeed = normalizeSeed(seedInput);
  const seedHash = xmur3(normalizedSeed)();
  const random = mulberry32(seedHash);
  return {
    seed: normalizedSeed,
    random,
    nextFloat: () => random(),
    nextInt: (maxExclusive) => Math.floor(random() * maxExclusive),
  };
}

export function createRunSeed(prefix = "run") {
  const entropy = Math.floor(Math.random() * 0xffffffff).toString(16);
  return `${prefix}-${Date.now().toString(36)}-${entropy}`;
}

export function randomInRange(rng, min, max) {
  return min + (max - min) * rng.nextFloat();
}

export function pickFromArray(rng, items) {
  if (!items || items.length === 0) {
    return undefined;
  }
  return items[rng.nextInt(items.length)];
}

export function shuffleWithSeed(seedInput, items) {
  const rng = createSeededRandom(seedInput);
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.nextInt(index + 1);
    const temp = output[index];
    output[index] = output[swapIndex];
    output[swapIndex] = temp;
  }
  return output;
}
