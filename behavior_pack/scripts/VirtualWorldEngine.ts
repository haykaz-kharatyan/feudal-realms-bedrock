import { world, Vector3 } from "@minecraft/server";
import { SettlementData, CityTier, CityProgression, EconomicProfile, RulerTrait } from "./CityProgression";
import { BuildingEngine } from "./BuildingEngine";
import { FactionManager } from "./FactionManager";
import { AllianceSystem } from "./AllianceSystem";
import { WorldEventsEngine } from "./WorldEventsEngine";

export interface BanditClanData {
  id: string;
  name: string;
  location: Vector3;
  dimensionId: string;
  raiderCount: number;
  plunderTreasury: number;
  catapultsCount?: number;
  aggressionTargetId?: string;
}

export class VirtualWorldEngine {
  private static settlements: Map<string, SettlementData> = new Map();
  private static banditClans: Map<string, BanditClanData> = new Map();
  private static pendingMaterializations: Map<string, number> = new Map();
  private static registeredTickingAreas: Set<string> = new Set();

  private static lastSimTick = 0;

  public static initializeDefaultRealms() {
    // Check if world already has persisted state
    const saved = world.getDynamicProperty("feudal_virtual_settlements");
    if (typeof saved === "string") {
      try {
        const parsed = JSON.parse(saved);
        this.settlements = new Map(parsed);
      } catch {
        // Fallback to initial seeds
      }
    }

    // If empty, seed world with mega-scale kingdoms and massive bandit hordes
    if (this.settlements.size === 0) {
      // 1. Player's Home Realm: Thriving Agricultural Kingdom
      this.registerSettlement({
        factionId: "fact_kingdom_1",
        tier: CityTier.Village,
        throneLocation: { x: 100, y: 68, z: 100 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 500, stone: 300, iron: 80, emeralds: 90, food: 450 },
        population: 180,
        militaryCount: 45, // 25% of population
        taxRatePercent: 10,
        economicProfile: EconomicProfile.AgrarianBreadbasket,
        rulerTrait: RulerTrait.Honorable
      });

      // 2. Powerful Rival City-Fortress (OVER 1,000 RESIDENTS!)
      this.registerSettlement({
        factionId: "fact_rival_2",
        tier: CityTier.FortressCity,
        throneLocation: { x: -600, y: 72, z: 800 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 2400, stone: 3200, iron: 650, emeralds: 500, food: 2800 },
        population: 1450, // 1450 CITIZENS!
        militaryCount: 500, // ~35% army!
        taxRatePercent: 20,
        economicProfile: EconomicProfile.MilitaryFortress,
        rulerTrait: RulerTrait.Warlord
      });

      // 3. Distant Trade Metropolis
      this.registerSettlement({
        factionId: "fact_empire_3",
        tier: CityTier.BigCity,
        throneLocation: { x: 1200, y: 70, z: -900 },
        dimensionId: "minecraft:overworld",
        treasury: { wood: 4500, stone: 3800, iron: 900, emeralds: 1400, food: 5000 },
        population: 3200, // 3200 CITIZENS!
        militaryCount: 960, // 30% army!
        taxRatePercent: 15,
        economicProfile: EconomicProfile.TradeMetropolis,
        rulerTrait: RulerTrait.Wise
      });

      // 4. Massive Competitive Bandit Hordes
      this.registerBanditClan({
        id: "clan_black_ravens",
        name: "Орда Черных Воронов",
        location: { x: -350, y: 70, z: 450 },
        dimensionId: "minecraft:overworld",
        raiderCount: 280, // Massive 280 raiders!
        plunderTreasury: 250,
        catapultsCount: 3,
        aggressionTargetId: "fact_kingdom_1"
      });

      this.registerBanditClan({
        id: "clan_steppe_horde",
        name: "Степная Орда Налетчиков",
        location: { x: -950, y: 68, z: 1200 },
        dimensionId: "minecraft:overworld",
        raiderCount: 650, // Massive 650 raiders!
        plunderTreasury: 550,
        catapultsCount: 5,
        aggressionTargetId: "fact_rival_2"
      });
    }
  }

  public static registerSettlement(settlement: SettlementData) {
    this.settlements.set(settlement.factionId, settlement);
    this.saveState();
  }

  public static getSettlement(id: string): SettlementData | undefined {
    return this.settlements.get(id);
  }

  public static getAllSettlements(): Map<string, SettlementData> {
    return this.settlements;
  }

  public static registerBanditClan(clan: BanditClanData) {
    this.banditClans.set(clan.id, clan);
  }

  /**
   * Bedrock Native Chunkloading via Ticking Areas.
   * Keeps the most vital capitals loaded so physical simulation continues regardless of player distance.
   */
  public static ensureTickingArea(settlement: SettlementData) {
    const areaName = `feudal_${settlement.factionId.slice(0, 10)}`;
    if (this.registeredTickingAreas.has(areaName)) return;

    try {
      const dim = world.getDimension(settlement.dimensionId);
      const pos = settlement.throneLocation;
      dim.runCommand(`tickingarea add circle ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)} 2 ${areaName}`);
      this.registeredTickingAreas.add(areaName);
      console.warn(`[TickingArea] Запущен постоянный чанклоадер для ${settlement.factionId} на [${pos.x}, ${pos.z}]`);
    } catch {
      // Maximum ticking areas reached (Bedrock limit is 10), virtual simulation takes over seamlessly!
    }
  }

  /**
   * Virtual World Cycle (runs independently of chunk loading).
   * Simulates production, population changes, upgrades and war across all distant settlements.
   */
  public static tickVirtualWorld() {
    this.lastSimTick++;
    // Simulate every 600 ticks (~30 seconds = 1 virtual in-game morning/evening)
    if (this.lastSimTick % 600 !== 0) return;

    // 0. Simulate Global World Calamities & Events
    WorldEventsEngine.tick();

    for (const settlement of this.settlements.values()) {
      // 1. Economic Production scaled for large populations
      const pop = settlement.population;
      const prodFactor = Math.max(5, Math.floor(pop * 0.08));
      settlement.treasury.wood += prodFactor * 3;
      settlement.treasury.stone += prodFactor * 2;
      settlement.treasury.iron += Math.floor(prodFactor * 0.5);
      settlement.treasury.food += prodFactor * 4;
      settlement.treasury.emeralds += Math.floor(prodFactor * 0.3);

      // 2. Population Growth (when city has excess food)
      if (settlement.treasury.food > pop * 2) {
        settlement.population += Math.max(2, Math.floor(pop * 0.03));
        settlement.treasury.food -= Math.floor(pop * 0.05);
      }

      // Recalculate standing army (20% - 50%)
      CityProgression.recalculateMilitary(settlement);

      // 3. Autonomous Upgrades across the world
      if (CityProgression.canUpgrade(settlement)) {
        if (CityProgression.upgradeTier(settlement)) {
          this.pendingMaterializations.set(settlement.factionId, settlement.tier);
          const faction = FactionManager.getFaction(settlement.factionId);
          world.sendMessage(
            `[Летопись Мира] Далекое королевство "${faction?.name ?? settlement.factionId}" завершило эволюцию до: ${CityTier[settlement.tier]}!`
          );
        }
      }
    }

    // 4. Simulate Mega-Scale Bandit Hordes and Siege Battles
    for (const clan of this.banditClans.values()) {
      clan.raiderCount += Math.floor(Math.random() * 5); // Rapid horde replenishment

      if (clan.aggressionTargetId) {
        const targetTown = this.settlements.get(clan.aggressionTargetId);
        if (targetTown && clan.raiderCount > 40) {
          // Defense includes own army plus military alliance coalition reinforcement!
          const defensePower = AllianceSystem.calculateCombinedDefense(targetTown);
          const siegeArtilleryBonus = (clan.catapultsCount ?? 2) * 120;
          const attackPower = clan.raiderCount * 6 + siegeArtilleryBonus;

          if (attackPower > defensePower) {
            // Bandits breach outskirts with siege weapons
            const stolenEmeralds = Math.min(150, Math.floor(targetTown.treasury.emeralds * 0.3));
            const stolenFood = Math.min(300, Math.floor(targetTown.treasury.food * 0.3));
            targetTown.treasury.emeralds -= stolenEmeralds;
            targetTown.treasury.food -= stolenFood;
            clan.plunderTreasury += stolenEmeralds;
            clan.raiderCount = Math.max(30, clan.raiderCount - 15);

            world.sendMessage(
              `§c[ОСАДА] ${clan.name} применил катапульты и прорвал укрепления ${targetTown.factionId}! Разграблено ${stolenEmeralds} изумрудов и обоз с провиантом!§r`
            );
          } else {
            // Town & Allies successfully repelled the raid with ballistas
            clan.raiderCount = Math.max(20, clan.raiderCount - 25);
            targetTown.treasury.emeralds += 80; // captured enemy war chest
            world.sendMessage(
              `§b[Оборона Города] Гарнизон и союзники ${targetTown.factionId} огнем баллист и лавиной стрел разгромили штурм орды разбойников!§r`
            );
          }
        }
      }
    }

    this.saveState();
  }

  /**
   * When a player approaches a distant settlement that evolved in the background,
   * this physically materializes new buildings and citizens.
   */
  public static checkPlayerProximityAndMaterialize(playerPos: Vector3, playerDimId: string) {
    for (const [factionId, pendingTier] of this.pendingMaterializations.entries()) {
      const settlement = this.settlements.get(factionId);
      if (!settlement || settlement.dimensionId !== playerDimId) continue;

      const distSq =
        Math.pow(playerPos.x - settlement.throneLocation.x, 2) +
        Math.pow(playerPos.z - settlement.throneLocation.z, 2);

      // Within loading distance (64 blocks)
      if (distSq < 4096) {
        this.pendingMaterializations.delete(factionId);

        // Erect defensive stone watchtower
        const towerPos: Vector3 = {
          x: settlement.throneLocation.x + 8,
          y: settlement.throneLocation.y,
          z: settlement.throneLocation.z + 8
        };
        BuildingEngine.startConstruction(
          settlement.dimensionId,
          towerPos,
          3,
          7,
          BuildingEngine.getStoneTowerBlueprint()
        );

        // Spawn specialized profession citizens to populate the upgraded town
        this.spawnCitizensForTier(settlement);

        world.sendMessage(
          `[Материализация] Город ${factionId} встречает вас обновленным рубежом и гарнизоном!`
        );
      }
    }
  }

  private static spawnCitizensForTier(settlement: SettlementData) {
    const dim = world.getDimension(settlement.dimensionId);
    if (!dim) return;

    const loc = settlement.throneLocation;
    const professions = [
      "feudal:miner",
      "feudal:lumberjack",
      "feudal:blacksmith",
      "feudal:merchant",
      "feudal:farmer",
      "feudal:lamplighter",
      "feudal:city_guard"
    ];

    for (const prof of professions) {
      try {
        dim.spawnEntity(prof, {
          x: loc.x + (Math.random() * 6 - 3),
          y: loc.y,
          z: loc.z + (Math.random() * 6 - 3)
        });
      } catch {
        // Entity spawn fallback
      }
    }
  }

  private static saveState() {
    world.setDynamicProperty(
      "feudal_virtual_settlements",
      JSON.stringify(Array.from(this.settlements.entries()))
    );
  }
}
