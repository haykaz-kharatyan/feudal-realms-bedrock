import { world, Dimension, Vector3, BlockPermutation } from "@minecraft/server";
import { SettlementData, CityTier, EconomicProfile, RulerTrait } from "./CityProgression";
import { VirtualWorldEngine } from "./VirtualWorldEngine";
import { CastleArchitectureEngine } from "./CastleArchitectureEngine";
import { BorderManager } from "./BorderManager";

export class NaturalKingdomSpawner {
  private static hasCheckedInitialSpawn = false;

  /**
   * Scans downward from y=120 to y=55 to find the real surface ground (not water, not leaves).
   */
  public static findSurfaceY(dim: Dimension, x: number, z: number): number | null {
    for (let y = 120; y >= 55; y--) {
      try {
        const block = dim.getBlock({ x, y, z });
        if (!block || block.isAir || block.isLiquid) continue;

        const type = block.typeId;
        // Check for solid terrain ground
        if (
          type.includes("grass") ||
          type.includes("dirt") ||
          type.includes("stone") ||
          type.includes("sand") ||
          type.includes("terracotta") ||
          type.includes("podzol")
        ) {
          return y + 1; // Position right on top of ground
        }
      } catch {}
    }
    return null;
  }

  /**
   * Automatically generates a living medieval settlement near the player if none exists.
   */
  public static checkAndSpawnNaturalKingdom(player: any, activeSettlements: Map<string, SettlementData>) {
    // If a settlement is already within 300 blocks of player, do not duplicate
    for (const s of activeSettlements.values()) {
      const dx = s.throneLocation.x - player.location.x;
      const dz = s.throneLocation.z - player.location.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 300) {
        return;
      }
    }

    const dim = player.dimension;
    // Offset by ~45 blocks from the player so it's in plain sight
    const targetX = Math.floor(player.location.x) + 40;
    const targetZ = Math.floor(player.location.z) + 40;

    const surfaceY = this.findSurfaceY(dim, targetX, targetZ);
    if (surfaceY === null) return;

    const thronePos: Vector3 = {
      x: targetX,
      y: surfaceY,
      z: targetZ
    };

    // 1. Place Throne block on the ground
    try {
      const throneBlock = dim.getBlock(thronePos);
      if (throneBlock) {
        throneBlock.setPermutation(BlockPermutation.resolve("feudal:throne"));
      }
    } catch {}

    // 2. Register Settlement
    const newSettlement: SettlementData = {
      factionId: "fact_kingdom_1",
      tier: CityTier.Village,
      throneLocation: thronePos,
      dimensionId: dim.id,
      treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
      population: 180,
      militaryCount: 45,
      taxRatePercent: 10,
      economicProfile: EconomicProfile.AgrarianBreadbasket,
      rulerTrait: RulerTrait.Honorable
    };

    activeSettlements.set("fact_kingdom_1", newSettlement);
    VirtualWorldEngine.registerSettlement(newSettlement);
    VirtualWorldEngine.ensureTickingArea(newSettlement);
    BorderManager.updateBordersForSettlement(newSettlement);

    // 3. Spawn Royal Advisor and City Guards
    try {
      const advisor = dim.spawnEntity("feudal:advisor", {
        x: thronePos.x,
        y: thronePos.y,
        z: thronePos.z + 2
      });
      advisor.nameTag = `Королевский Советник`;

      const guard1 = dim.spawnEntity("feudal:city_guard", {
        x: thronePos.x - 3,
        y: thronePos.y,
        z: thronePos.z + 2
      });
      guard1.nameTag = `Гвардеец Трона`;

      const guard2 = dim.spawnEntity("feudal:city_guard", {
        x: thronePos.x + 3,
        y: thronePos.y,
        z: thronePos.z + 2
      });
      guard2.nameTag = `Гвардеец Трона`;

      const blacksmith = dim.spawnEntity("feudal:blacksmith", {
        x: thronePos.x + 4,
        y: thronePos.y,
        z: thronePos.z - 3
      });
      blacksmith.nameTag = `Королевский Кузнец`;
    } catch {}

    // 4. Construct Village Town Hall with complete roof and foundation
    CastleArchitectureEngine.constructOrUpgradeCastle(newSettlement);

    world.sendMessage(
      `§6§l[КОРОЛЕВСТВО ОБНАРУЖЕНО]§r §eВпереди раскинулись владения с Королевским Троном! Координаты: [${thronePos.x}, ${thronePos.y}, ${thronePos.z}]. Следуйте по компасу на экране!§r`
    );
  }
}
