import { world, Vector3, BlockPermutation } from "@minecraft/server";
import { SettlementData, CityTier } from "./CityProgression";
import { FactionManager } from "./FactionManager";

export interface RealmBorderData {
  factionId: string;
  rulerTitle: string;
  capitalLocation: Vector3;
  cityRadius: number;
  totalTerritoryAreaSqKm: number;
  vassalSettlementIds: string[];
  frontierMarkers: Vector3[];
}

export class BorderManager {
  private static borders: Map<string, RealmBorderData> = new Map();

  /**
   * Calculates dynamic city border radius based on tier:
   * Tier 1 (Camp): 48 blocks
   * Tier 2 (Village): 96 blocks
   * Tier 3 (SmallTown): 160 blocks
   * Tier 4 (FortressCity): 256 blocks
   * Tier 5 (BigCity): 384 blocks
   * Tier 6 (Metropolis): 512 blocks
   * Tier 7 (Capital): 768 blocks
   */
  public static getCityRadius(tier: CityTier): number {
    switch (tier) {
      case CityTier.Camp: return 48;
      case CityTier.Village: return 96;
      case CityTier.SmallTown: return 160;
      case CityTier.FortressCity: return 256;
      case CityTier.BigCity: return 384;
      case CityTier.Metropolis: return 512;
      case CityTier.Capital: return 768;
      default: return 64;
    }
  }

  public static updateBordersForSettlement(settlement: SettlementData): RealmBorderData {
    const faction = FactionManager.getFaction(settlement.factionId);
    const radius = this.getCityRadius(settlement.tier);
    const vassalCount = faction?.vassalIds.length ?? 0;

    // Total national territory includes sovereign city plus all vassal colonies
    const totalArea = Math.PI * Math.pow(radius, 2) + vassalCount * Math.PI * Math.pow(96, 2);

    const borderData: RealmBorderData = {
      factionId: settlement.factionId,
      rulerTitle: faction?.title ?? "Вождь",
      capitalLocation: settlement.throneLocation,
      cityRadius: radius,
      totalTerritoryAreaSqKm: Math.round((totalArea / 1000000) * 100) / 100,
      vassalSettlementIds: faction?.vassalIds ?? [],
      frontierMarkers: []
    };

    this.borders.set(settlement.factionId, borderData);
    return borderData;
  }

  public static getBorder(factionId: string): RealmBorderData | undefined {
    return this.borders.get(factionId);
  }

  public static getAllBorders(): Map<string, RealmBorderData> {
    return this.borders;
  }

  /**
   * Automatically places boundary stones along the city perimeter at primary cardinal directions.
   */
  public static placeFrontierBoundaryStone(settlement: SettlementData, directionAngle: number) {
    const dim = world.getDimension(settlement.dimensionId);
    if (!dim) return;

    const radius = this.getCityRadius(settlement.tier);
    const targetX = Math.floor(settlement.throneLocation.x + Math.cos(directionAngle) * radius);
    const targetZ = Math.floor(settlement.throneLocation.z + Math.sin(directionAngle) * radius);
    const yCenter = settlement.throneLocation.y;

    for (let dy = 6; dy >= -6; dy--) {
      const groundPos: Vector3 = { x: targetX, y: yCenter + dy, z: targetZ };
      const ground = dim.getBlock(groundPos);
      const airPos: Vector3 = { x: targetX, y: yCenter + dy + 1, z: targetZ };
      const air = dim.getBlock(airPos);

      if (ground && !ground.isAir && air && air.isAir) {
        try {
          air.setPermutation(BlockPermutation.resolve("feudal:boundary_stone"));
          dim.spawnParticle("minecraft:totem_particle", {
            x: targetX + 0.5,
            y: yCenter + dy + 1.5,
            z: targetZ + 0.5
          });
          const border = this.borders.get(settlement.factionId);
          if (border) border.frontierMarkers.push(airPos);
          break;
        } catch {
          // Chunk might be ungenerated
        }
      }
    }
  }

  /**
   * Checks if a coordinate is within a settlement's legal city borders.
   */
  public static isInsideSettlement(pos: Vector3, settlement: SettlementData): boolean {
    const radius = this.getCityRadius(settlement.tier);
    const dx = pos.x - settlement.throneLocation.x;
    const dz = pos.z - settlement.throneLocation.z;
    return dx * dx + dz * dz <= radius * radius;
  }
}
