import { world, Vector3, BlockPermutation } from "@minecraft/server";
import { SettlementData, CityTier } from "./CityProgression";
import { FactionManager, FactionData } from "./FactionManager";
import { VirtualWorldEngine } from "./VirtualWorldEngine";
import { BuildingEngine } from "./BuildingEngine";

export interface ColonizationMission {
  id: string;
  parentSettlementId: string;
  colonyName: string;
  origin: Vector3;
  targetLocation: Vector3;
  dimensionId: string;
  colonistLeaderId?: string;
  progressPercent: number;
  established: boolean;
}

export class ColonizationEngine {
  private static activeExpeditions: Map<string, ColonizationMission> = new Map();

  /**
   * Checks if a city can send a colonization expedition.
   * Requires Tier 4 (Fortress City) or higher and surplus treasury.
   */
  public static canColonize(settlement: SettlementData): boolean {
    return (
      settlement.tier >= CityTier.FortressCity &&
      settlement.treasury.wood >= 400 &&
      settlement.treasury.stone >= 250 &&
      settlement.treasury.food >= 150 &&
      settlement.treasury.emeralds >= 40 &&
      settlement.population >= 30
    );
  }

  /**
   * Dispatches a colonization expedition to establish a new frontier village.
   */
  public static launchExpedition(settlement: SettlementData, customColonyName?: string): string {
    if (!this.canColonize(settlement)) {
      return "";
    }

    // Deduct colonization resource investment
    settlement.treasury.wood -= 400;
    settlement.treasury.stone -= 250;
    settlement.treasury.food -= 150;
    settlement.treasury.emeralds -= 40;
    settlement.population -= 6; // colonists departing

    const parentFaction = FactionManager.getFaction(settlement.factionId);
    const parentName = parentFaction?.name ?? "Королевство";
    const colonyName = customColonyName ?? `Новый ${parentName}`;

    // Pick target frontier location (600 to 1200 blocks away in unexplored lands)
    const angle = Math.random() * Math.PI * 2;
    const distance = 600 + Math.random() * 600;
    const targetX = Math.floor(settlement.throneLocation.x + Math.cos(angle) * distance);
    const targetZ = Math.floor(settlement.throneLocation.z + Math.sin(angle) * distance);
    const targetLoc: Vector3 = { x: targetX, y: 70, z: targetZ };

    const missionId = `colony_exp_${Date.now()}`;
    const dim = world.getDimension(settlement.dimensionId);

    // Spawn colonist pioneer party at origin if loaded
    let leaderId: string | undefined = undefined;
    try {
      const leader = dim.spawnEntity("feudal:colonist", {
        x: settlement.throneLocation.x + 2,
        y: settlement.throneLocation.y,
        z: settlement.throneLocation.z + 2
      });
      leader.nameTag = `Лидер колонистов: ${colonyName}`;
      leader.addTag(`colony_expedition:${missionId}`);
      leaderId = leader.id;

      // Pack mule with colony equipment
      const mule = dim.spawnEntity("minecraft:mule", {
        x: settlement.throneLocation.x + 3,
        y: settlement.throneLocation.y,
        z: settlement.throneLocation.z + 1
      });
      mule.nameTag = "Припасы колонистов";
    } catch {
      // Chunk virtualized
    }

    const mission: ColonizationMission = {
      id: missionId,
      parentSettlementId: settlement.factionId,
      colonyName,
      origin: settlement.throneLocation,
      targetLocation: targetLoc,
      dimensionId: settlement.dimensionId,
      colonistLeaderId: leaderId,
      progressPercent: 0,
      established: false
    };

    this.activeExpeditions.set(missionId, mission);
    world.sendMessage(
      `[Великая Колонизация] Из города ${settlement.factionId} выдвинулся отряд колонистов основывать поселение "${colonyName}"!`
    );
    return missionId;
  }

  public static tick() {
    for (const [id, mission] of this.activeExpeditions.entries()) {
      if (mission.established) continue;

      // Progress travel towards target (virtual travel step)
      mission.progressPercent += 5;

      if (mission.progressPercent >= 100) {
        mission.established = true;
        this.activeExpeditions.delete(id);
        this.foundColony(mission);
      }
    }
  }

  /**
   * Colonists arrive at destination: establishes new Throne, registers Faction and Colony Settlement.
   */
  private static foundColony(mission: ColonizationMission) {
    const colonyFactionId = `colony_${Date.now()}`;
    const dim = world.getDimension(mission.dimensionId);

    // Register new unique vassal banner and faction
    const newBanner = FactionManager.generateUniqueBanner("village");
    const colonyFaction: FactionData = {
      id: colonyFactionId,
      name: mission.colonyName,
      type: "village",
      banner: newBanner,
      overlordId: mission.parentSettlementId,
      vassalIds: [],
      rulerName: "Первопроходец",
      title: "Староста"
    };
    FactionManager.registerFaction(colonyFaction);

    // Register parent overlord link
    const parentFaction = FactionManager.getFaction(mission.parentSettlementId);
    if (parentFaction) {
      parentFaction.vassalIds.push(colonyFactionId);
      FactionManager.registerFaction(parentFaction);
    }

    // Place Throne block at colony center if chunk is accessible
    const pos = mission.targetLocation;
    try {
      const throneBlock = dim.getBlock(pos);
      if (throneBlock) {
        throneBlock.setPermutation(BlockPermutation.resolve("feudal:throne"));
      }
    } catch {
      // Will materialize upon player arrival
    }

    // Register new settlement in VirtualWorldEngine
    const newColonySettlement: SettlementData = {
      factionId: colonyFactionId,
      tier: CityTier.Camp,
      throneLocation: pos,
      dimensionId: mission.dimensionId,
      treasury: { wood: 100, stone: 60, iron: 15, emeralds: 20, food: 100 },
      population: 10,
      militaryCount: 2,
      taxRatePercent: 12
    };
    VirtualWorldEngine.registerSettlement(newColonySettlement);

    // Clear initial camp clearing & spawn starter pioneer workers
    try {
      dim.spawnEntity("feudal:colonist", { x: pos.x + 1, y: pos.y, z: pos.z });
      dim.spawnEntity("feudal:lumberjack", { x: pos.x - 1, y: pos.y, z: pos.z });
      dim.spawnEntity("feudal:miner", { x: pos.x, y: pos.y, z: pos.z + 1 });
      dim.spawnEntity("feudal:lamplighter", { x: pos.x, y: pos.y, z: pos.z - 1 });
    } catch {
      // Chunk not loaded yet
    }

    world.sendMessage(
      `[Основание Колонии] Первопроходцы успешно заложили Трон и основали поселение "${mission.colonyName}" на координатах [${pos.x}, ${pos.z}]!`
    );
  }

  public static getActiveExpeditions(): Map<string, ColonizationMission> {
    return this.activeExpeditions;
  }
}
