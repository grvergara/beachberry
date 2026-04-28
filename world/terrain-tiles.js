const DEFAULT_BOUNDS = Object.freeze({
  minX: -250,
  maxX: 250,
  minZ: -250,
  maxZ: 250,
});

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function pointInsideBounds(position, bounds = DEFAULT_BOUNDS) {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.z >= bounds.minZ &&
    position.z <= bounds.maxZ
  );
}

export function createTerrainTilesSystem(options = {}) {
  const bounds = options.bounds ?? DEFAULT_BOUNDS;
  const tileSource = options.tileSource ?? null;
  const loadedTiles = new Map();
  const temporaryPaintPaths = new Map();

  async function loadTilesInBounds() {
    if (!tileSource || typeof tileSource.loadTiles !== "function") {
      return [];
    }

    const tiles = await tileSource.loadTiles(bounds);
    const filteredTiles = tiles.filter((tile) => pointInsideBounds(tile.center, bounds));
    for (const tile of filteredTiles) {
      loadedTiles.set(tile.id, tile);
    }
    return filteredTiles;
  }

  function extractWalkableCollisionMesh(maxSlopeDeg = 42) {
    const maxSlopeRadians = toRadians(maxSlopeDeg);
    const walkableTriangles = [];

    for (const tile of loadedTiles.values()) {
      const triangles = tile.triangles ?? [];
      for (const triangle of triangles) {
        const normal = triangle.normal ?? { x: 0, y: 1, z: 0 };
        const slope = Math.acos(Math.max(-1, Math.min(1, normal.y)));
        if (slope <= maxSlopeRadians) {
          walkableTriangles.push({
            tileId: tile.id,
            vertices: triangle.vertices,
            normal,
          });
        }
      }
    }

    const now = typeof options.now === "function" ? options.now() : performance.now();
    for (const [pathId, path] of temporaryPaintPaths) {
      if (path.expiresAt <= now) {
        temporaryPaintPaths.delete(pathId);
        continue;
      }
      walkableTriangles.push({
        tileId: `paint:${pathId}`,
        vertices: path.vertices,
        normal: { x: 0, y: 1, z: 0 },
      });
    }

    return {
      bounds,
      triangleCount: walkableTriangles.length,
      triangles: walkableTriangles,
    };
  }

  function validatePaintPlacement(anchor) {
    if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.z)) {
      return { valid: false, reason: "missing-anchor" };
    }
    if (!pointInsideBounds(anchor, bounds)) {
      return { valid: false, reason: "outside-bounds" };
    }
    return { valid: true, reason: null };
  }

  function createTemporaryPaintPath(path = {}) {
    const now = typeof options.now === "function" ? options.now() : performance.now();
    const id = path.id ?? `paint-path-${Math.random().toString(36).slice(2, 9)}`;
    const start = path.start ?? null;
    const end = path.end ?? null;
    const validation = validatePaintPlacement(start ?? end);
    if (!validation.valid) {
      return { ok: false, reason: validation.reason };
    }
    if (!end || !pointInsideBounds(end, bounds)) {
      return { ok: false, reason: "invalid-endpoint" };
    }
    const expiresAt = Number.isFinite(path.expiresAt) ? path.expiresAt : now + 25_000;
    const vertices = [
      { x: start.x, y: start.y ?? 0.1, z: start.z },
      { x: end.x, y: end.y ?? 0.1, z: end.z },
      { x: end.x, y: (end.y ?? 0.1) + 0.05, z: end.z + 0.5 },
    ];
    const record = {
      id,
      start,
      end,
      createdAt: now,
      expiresAt,
      width: Number.isFinite(path.width) ? path.width : 1.6,
      vertices,
      source: path.source ?? "paint-weaver",
    };
    temporaryPaintPaths.set(id, record);
    return { ok: true, path: record };
  }

  function clearExpiredPaintPaths(timeNow = typeof options.now === "function" ? options.now() : performance.now()) {
    let removed = 0;
    for (const [pathId, path] of temporaryPaintPaths) {
      if (path.expiresAt <= timeNow) {
        temporaryPaintPaths.delete(pathId);
        removed += 1;
      }
    }
    return removed;
  }

  return {
    bounds,
    loadedTiles,
    loadTilesInBounds,
    extractWalkableCollisionMesh,
    validatePaintPlacement,
    createTemporaryPaintPath,
    clearExpiredPaintPaths,
    getTemporaryPaintPaths: () => [...temporaryPaintPaths.values()],
  };
}
