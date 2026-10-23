import { world, Vector3, BlockPermutation } from "@minecraft/server";
import { SettlementData } from "./CityProgression";
import { BorderManager } from "./BorderManager";

export class CityLightingEngine {
  private static lastCheckTick = 0;
  private static sectorIndexMap: Map<string, number> = new Map();

  /**
   * Scans and illuminates the entire city territory, scaling dynamically
   * from 48 blocks up to 768 blocks for capitals and metropolises.
   */
  public static inspectAndLightCity(settlement: SettlementData) {
    const dim = world.getDimension(settlement.dimensionId);
    if (!dim) return;

    // Use full city radius from BorderManager
    const fullRadius = BorderManager.getCityRadius(settlement.tier);
    const center = settlement.throneLocation;

    // Cycle through 16 radial sectors to distribute work smoothly across ticks
    let currentSector = this.sectorIndexMap.get(settlement.factionId) ?? 0;
    this.sectorIndexMap.set(settlement.factionId, (currentSector + 1) % 16);

    const sectorAngleStart = (currentSector / 16) * Math.PI * 2;
    const sectorAngleEnd = ((currentSector + 1) / 16) * Math.PI * 2;

    let torchesPlacedThisCycle = 0;
    const maxTorchesPerCycle = 5;

    // Sample positions across the current sector from town center to outer frontier
    for (let attempts = 0; attempts < 25; attempts++) {
      if (torchesPlacedThisCycle >= maxTorchesPerCycle) break;

      const angle = sectorAngleStart + Math.random() * (sectorAngleEnd - sectorAngleStart);
      // Sample both inner streets and outer suburbs
      const dist = 10 + Math.random() * (fullRadius - 10);
      const targetX = Math.floor(center.x + Math.cos(angle) * dist);
      const targetZ = Math.floor(center.z + Math.sin(angle) * dist);

      // Search vertical column for surface
      for (let dy = 8; dy >= -8; dy--) {
        const checkPos: Vector3 = { x: targetX, y: center.y + dy, z: targetZ };
        const groundBlock = dim.getBlock(checkPos);
        const airBlock = dim.getBlock({ x: targetX, y: center.y + dy + 1, z: targetZ });

        if (groundBlock && !groundBlock.isAir && airBlock && airBlock.isAir) {
          // Check for nearby torches in an 8-block grid
          const isTorchNear = this.isTorchNearby(dim, checkPos, 8);

          if (!isTorchNear) {
            try {
              // In inner districts (dist < 80), place ornate lanterns; in outer districts, place standing torches
              const torchType = dist < 80 ? "minecraft:lantern" : "minecraft:torch";
              airBlock.setPermutation(BlockPermutation.resolve(torchType));
              torchesPlacedThisCycle++;

              dim.spawnParticle("minecraft:basic_flame_particle", {
                x: targetX + 0.5,
                y: center.y + dy + 1.2,
                z: targetZ + 0.5
              });
              break;
            } catch {
              // Block placement failed (e.g. edge of unloaded chunk)
            }
          }
        }
      }
    }
  }

  private static isTorchNearby(dim: any, pos: Vector3, checkRadius: number): boolean {
    for (let rx = -checkRadius; rx <= checkRadius; rx += 3) {
      for (let rz = -checkRadius; rz <= checkRadius; rz += 3) {
        for (let ry = -1; ry <= 2; ry++) {
          const b = dim.getBlock({ x: pos.x + rx, y: pos.y + ry, z: pos.z + rz });
          if (b && (b.typeId === "minecraft:torch" || b.typeId === "minecraft:lantern")) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public static tick(activeSettlements: Map<string, SettlementData>) {
    this.lastCheckTick++;
    // Run every 60 ticks (~3 seconds) to steadily light up expanding cities
    if (this.lastCheckTick % 60 !== 0) return;

    for (const settlement of activeSettlements.values()) {
      this.inspectAndLightCity(settlement);
    }
  }
}
