import { Vector3, world } from "@minecraft/server";
import { FactionManager } from "./FactionManager";
import { CastleArchitectureEngine } from "./CastleArchitectureEngine";
import { MedievalWallEngine } from "./MedievalWallEngine";

export enum CityTier {
  Camp = 1,
  Village = 2,
  SmallTown = 3,
  FortressCity = 4,
  BigCity = 5,
  Metropolis = 6,
  Capital = 7
}

export enum EconomicProfile {
  MiningHub = "Горнорудный центр",
  AgrarianBreadbasket = "Аграрная житница",
  LumberHaven = "Лесозаготовительный край",
  TradeMetropolis = "Торговый мегаполис",
  MilitaryFortress = "Военная цитадель"
}

export enum RulerTrait {
  Greedy = "Жадный",
  Honorable = "Благородный",
  Warlord = "Кровожадный",
  Schemer = "Интриган",
  Wise = "Мудрый"
}

export interface Treasury {
  wood: number;
  stone: number;
  iron: number;
  emeralds: number;
  food: number;
}

export interface SettlementData {
  factionId: string;
  tier: CityTier;
  throneLocation: Vector3;
  dimensionId: string;
  treasury: Treasury;
  population: number;
  militaryCount: number;
  taxRatePercent: number;
  economicProfile?: EconomicProfile;
  rulerTrait?: RulerTrait;
  isMobilized?: boolean;
}

export class CityProgression {
  /**
   * Massive Scale: Cities house from 50 up to 15,000+ residents!
   * Military capacity is strictly calibrated to 20% - 50% of total population.
   */
  public static tierConfig: Record<
    CityTier,
    {
      minPop: number;
      maxPop: number;
      baseMilitaryRatio: number; // 20% - 30% in peacetime
      mobilizedMilitaryRatio: number; // 40% - 50% in full mobilization
      upgradeReq: { pop: number; wood: number; stone: number; emeralds: number; food: number };
    }
  > = {
    [CityTier.Camp]: {
      minPop: 30,
      maxPop: 90,
      baseMilitaryRatio: 0.25,
      mobilizedMilitaryRatio: 0.45,
      upgradeReq: { pop: 60, wood: 120, stone: 40, emeralds: 10, food: 100 }
    },
    [CityTier.Village]: {
      minPop: 100,
      maxPop: 320,
      baseMilitaryRatio: 0.25,
      mobilizedMilitaryRatio: 0.45,
      upgradeReq: { pop: 250, wood: 350, stone: 180, emeralds: 30, food: 300 }
    },
    [CityTier.SmallTown]: {
      minPop: 350,
      maxPop: 850,
      baseMilitaryRatio: 0.28,
      mobilizedMilitaryRatio: 0.48,
      upgradeReq: { pop: 700, wood: 800, stone: 600, emeralds: 80, food: 700 }
    },
    [CityTier.FortressCity]: {
      minPop: 950,
      maxPop: 2200, // Scales past 1000+ residents!
      baseMilitaryRatio: 0.35,
      mobilizedMilitaryRatio: 0.50,
      upgradeReq: { pop: 1800, wood: 1800, stone: 1600, emeralds: 200, food: 1600 }
    },
    [CityTier.BigCity]: {
      minPop: 2500,
      maxPop: 5500,
      baseMilitaryRatio: 0.30,
      mobilizedMilitaryRatio: 0.50,
      upgradeReq: { pop: 4500, wood: 3500, stone: 3200, emeralds: 450, food: 3500 }
    },
    [CityTier.Metropolis]: {
      minPop: 6000,
      maxPop: 12000,
      baseMilitaryRatio: 0.32,
      mobilizedMilitaryRatio: 0.50,
      upgradeReq: { pop: 10000, wood: 6500, stone: 6000, emeralds: 900, food: 7500 }
    },
    [CityTier.Capital]: {
      minPop: 15000,
      maxPop: 35000, // Grand Imperial Metropolis
      baseMilitaryRatio: 0.35,
      mobilizedMilitaryRatio: 0.50,
      upgradeReq: { pop: 30000, wood: 15000, stone: 15000, emeralds: 2500, food: 20000 }
    }
  };

  public static canUpgrade(settlement: SettlementData): boolean {
    if (settlement.tier >= CityTier.Capital) return false;
    const req = this.tierConfig[settlement.tier].upgradeReq;
    return (
      settlement.population >= req.pop &&
      settlement.treasury.wood >= req.wood &&
      settlement.treasury.stone >= req.stone &&
      settlement.treasury.emeralds >= req.emeralds &&
      settlement.treasury.food >= req.food
    );
  }

  public static upgradeTier(settlement: SettlementData): boolean {
    if (!this.canUpgrade(settlement)) return false;
    const req = this.tierConfig[settlement.tier].upgradeReq;

    settlement.treasury.wood -= req.wood;
    settlement.treasury.stone -= req.stone;
    settlement.treasury.emeralds -= req.emeralds;
    settlement.treasury.food -= req.food;

    settlement.tier = (settlement.tier + 1) as CityTier;

    // Recalculate standing army size according to new population tier
    this.recalculateMilitary(settlement);

    const faction = FactionManager.getFaction(settlement.factionId);
    if (faction) {
      faction.title = FactionManager.calculateTitle(faction.vassalIds.length, settlement.tier);
      FactionManager.registerFaction(faction);
    }

    // Evolve the royal castle / town hall around the throne
    CastleArchitectureEngine.constructOrUpgradeCastle(settlement);

    // When advancing to FortressCity or higher, build authentic medieval walls
    if (settlement.tier === CityTier.FortressCity) {
      MedievalWallEngine.constructFortifiedCitadelPerimeter(settlement);
    }

    world.sendMessage(
      `§6§l[ФЕОДАЛЬНЫЕ ЗЕМЛИ] ${faction?.name ?? "Поселение"} достигло грандиозной эпохи: §e${CityTier[settlement.tier]}§6! Возводится величественный замок ${CityTier[settlement.tier]} уровня!§r`
    );
    return true;
  }

  /**
   * Calculates army size between 20% and 50% based on peacetime vs full wartime mobilization.
   */
  public static recalculateMilitary(settlement: SettlementData): number {
    const config = this.tierConfig[settlement.tier] ?? this.tierConfig[CityTier.Village];
    const ratio = settlement.isMobilized ? config.mobilizedMilitaryRatio : config.baseMilitaryRatio;
    settlement.militaryCount = Math.max(8, Math.floor(settlement.population * ratio));
    return settlement.militaryCount;
  }

  /**
   * Toggles general mobilization (raises army from ~25% to up to 50% of population)
   */
  public static toggleMobilization(settlement: SettlementData, enable: boolean): number {
    settlement.isMobilized = enable;
    const count = this.recalculateMilitary(settlement);
    if (enable) {
      world.sendMessage(
        `§c§l[ВСЕОБЩАЯ МОБИЛИЗАЦИЯ] В городе ${settlement.factionId} объявлен воинский призыв! Армия мобилизована до 50% населения (${count} штыков)!§r`
      );
    } else {
      world.sendMessage(
        `§a§l[МИРНОЕ ВРЕМЯ] Ополчение ${settlement.factionId} распущено по домам к полям и ремеслам. Гарнизон: ${count} регулярных воинов.§r`
      );
    }
    return count;
  }

  public static processTaxes(vassal: SettlementData, overlord: SettlementData) {
    const taxMod = vassal.taxRatePercent / 100;
    const woodTax = Math.floor(vassal.treasury.wood * taxMod);
    const stoneTax = Math.floor(vassal.treasury.stone * taxMod);
    const emeraldTax = Math.floor(vassal.treasury.emeralds * taxMod);

    vassal.treasury.wood -= woodTax;
    vassal.treasury.stone -= stoneTax;
    vassal.treasury.emeralds -= emeraldTax;

    overlord.treasury.wood += woodTax;
    overlord.treasury.stone += stoneTax;
    overlord.treasury.emeralds += emeraldTax;
  }
}
