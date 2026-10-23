import { world } from "@minecraft/server";
import { SettlementData } from "./CityProgression";
import { FactionManager } from "./FactionManager";

export interface MilitaryAlliance {
  id: string;
  name: string;
  leaderFactionId: string;
  memberFactionIds: string[];
  isBanditConfederacy: boolean;
  totalArmyStrength: number;
}

export class AllianceSystem {
  private static alliances: Map<string, MilitaryAlliance> = new Map();

  public static initializeAlliances() {
    if (this.alliances.size === 0) {
      // Seed starter military coalition between allied realms
      this.createAlliance("Лига Свободных Королевств", "fact_kingdom_1", ["fact_kingdom_1", "fact_rival_2"], false);

      // Seed bandit coalition
      this.createAlliance("Великая Бандитская Орда", "clan_black_ravens", ["clan_black_ravens", "clan_blood_axes"], true);
    }
  }

  public static createAlliance(
    name: string,
    leaderId: string,
    members: string[],
    isBandit: boolean
  ): MilitaryAlliance {
    const allianceId = `alliance_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const alliance: MilitaryAlliance = {
      id: allianceId,
      name,
      leaderFactionId: leaderId,
      memberFactionIds: members,
      isBanditConfederacy: isBandit,
      totalArmyStrength: members.length * 15
    };
    this.alliances.set(allianceId, alliance);
    world.sendMessage(
      isBandit
        ? `§c§l[БАНДИТСКИЙ АЛЬЯНС]§r §4Кланы разбойников объединились в союз «${name}» для штурма городов!§r`
        : `§b§l[ВОЕННЫЙ АЛЬЯНС]§r §eЗаключен священный военный договор «${name}» между монархами!§r`
    );
    return alliance;
  }

  public static joinAlliance(allianceId: string, factionId: string) {
    const alliance = this.alliances.get(allianceId);
    if (alliance && !alliance.memberFactionIds.includes(factionId)) {
      alliance.memberFactionIds.push(factionId);
      alliance.totalArmyStrength += 15;
      world.sendMessage(`[Альянс] Фракция ${factionId} вступила в состав «${alliance.name}»!`);
    }
  }

  public static getAllAlliances(): Map<string, MilitaryAlliance> {
    return this.alliances;
  }

  public static calculateCombinedDefense(settlement: SettlementData): number {
    let combinedPower = settlement.militaryCount * 10;

    for (const alliance of this.alliances.values()) {
      if (!alliance.isBanditConfederacy && alliance.memberFactionIds.includes(settlement.factionId)) {
        // Add 50% power of all allied members
        combinedPower += Math.floor(alliance.totalArmyStrength * 0.5);
        break;
      }
    }
    return combinedPower;
  }
}
