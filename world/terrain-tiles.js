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

    return {
      bounds,
      triangleCount: walkableTriangles.length,
      triangles: walkableTriangles,
    };
  }

  return {
    bounds,
    loadedTiles,
    loadTilesInBounds,
    extractWalkableCollisionMesh,
  };
}
