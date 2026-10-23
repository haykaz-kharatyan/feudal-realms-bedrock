import { Player, world, EntityDieAfterEvent } from "@minecraft/server";
import { MilitaryCareer, MilitaryRank } from "./MilitaryCareer";

export interface RPGProfileData {
  playerId: string;
  playerName: string;
  feudalTitle: string;
  regularKills: number;
  banditBossKills: number;
  rulerKills: number;
  siegeKills: number;
  unlockedEpithets: string[];
}

export class PlayerRPGProfile {
  private static profiles: Map<string, RPGProfileData> = new Map();

  private static titleHpBonus: Record<string, number> = {
    "Вождь": 0,
    "Рекрут": 0,
    "Староста": 4,
    "Сержант": 4,
    "Барон": 8,
    "Капитан": 8,
    "Капитан Гарнизона": 8,
    "Виконт": 12,
    "Граф": 16,
    "Генерал": 16,
    "Генерал Армии": 16,
    "Маркиз": 20,
    "Герцог": 24,
    "Великий Маршал": 24,
    "Великий Герцог": 28,
    "Король": 34,
    "Император": 44
  };

  public static getProfile(player: Player): RPGProfileData {
    let profile = this.profiles.get(player.id);
    if (!profile) {
      // Try restore from dynamic properties
      const saved = world.getDynamicProperty(`feudal_rpg_${player.id}`);
      if (typeof saved === "string") {
        try {
          profile = JSON.parse(saved);
        } catch {
          // fallback
        }
      }

      if (!profile) {
        const military = MilitaryCareer.getProfile(player);
        profile = {
          playerId: player.id,
          playerName: player.name,
          feudalTitle: military.rank,
          regularKills: 0,
          banditBossKills: 0,
          rulerKills: 0,
          siegeKills: 0,
          unlockedEpithets: []
        };
      }
      this.profiles.set(player.id, profile!);
    }
    return profile!;
  }

  public static handleEntityKill(event: EntityDieAfterEvent) {
    const damageSource = event.damageSource;
    const killer = damageSource.damagingEntity;
    if (!killer || !(killer instanceof Player)) return;

    const profile = this.getProfile(killer);
    const deadType = event.deadEntity?.typeId ?? "";

    if (deadType === "feudal:bandit_leader") {
      profile.banditBossKills++;
    } else if (deadType === "feudal:feudal_ruler") {
      profile.rulerKills++;
    } else if (deadType === "feudal:catapult" || deadType === "feudal:siege_ram" || deadType === "feudal:ballista") {
      profile.siegeKills++;
    } else {
      profile.regularKills++;
    }

    this.checkEpithetUnlocks(killer, profile);
    this.saveProfile(profile);
    this.applyHealthAndPassives(killer, profile);
  }

  private static checkEpithetUnlocks(player: Player, profile: RPGProfileData) {
    const checkAndAward = (name: string, condition: boolean, desc: string) => {
      if (condition && !profile.unlockedEpithets.includes(name)) {
        profile.unlockedEpithets.push(name);
        world.sendMessage(
          `§6§l[БОЕВОЙ ЭПИТЕТ]§r §e${player.name} удостоен легендарного звания §d«${name}»§r!\n§7${desc}§r`
        );
        try {
          player.dimension.spawnParticle("minecraft:totem_particle", {
            x: player.location.x,
            y: player.location.y + 1.8,
            z: player.location.z
          });
        } catch {
          // particles
        }
      }
    };

    checkAndAward("Убийца дюжины", profile.regularKills >= 12, "Победа над 12 врагами (+2 HP, Скорость I)");
    checkAndAward("Убийца сотни", profile.regularKills >= 100, "Победа над 100 врагами (+6 HP, Сопротивление I)");
    checkAndAward("Убийца тысячи", profile.regularKills >= 1000, "Победа над 1000 врагами (+12 HP, Сила I)");
    checkAndAward("Гроза бандитов", profile.banditBossKills >= 3, "Повержено 3 атамана (+4 HP, ярость воина)");
    checkAndAward("Истребитель атаманов", profile.banditBossKills >= 10, "Повержено 10 атаманов (+8 HP, Сопротивление II)");
    checkAndAward("Ниспровергатель королей", profile.rulerKills >= 1, "Свержение монарха (+10 HP, царственная аура)");
    checkAndAward("Несокрушимый осадник", profile.siegeKills >= 3, "Уничтожено 3 осадных орудия (+6 HP, Огнестойкость)");
    checkAndAward(
      "Легенда меча",
      profile.regularKills >= 250 && profile.banditBossKills >= 5,
      "Мастер клинка (+10 HP, Сила II, Спешка)"
    );
    checkAndAward(
      "Бог войны",
      profile.regularKills >= 500 && profile.banditBossKills >= 10 && profile.rulerKills >= 1,
      "Абсолютный триумф войны (+20 HP, Регенерация, Сопротивление II, Сила II)"
    );
  }

  public static applyHealthAndPassives(player: Player, profile?: RPGProfileData) {
    if (!profile) profile = this.getProfile(player);

    const titleBonus = this.titleHpBonus[profile.feudalTitle] ?? 0;
    let epithetBonus = 0;

    for (const ep of profile.unlockedEpithets) {
      if (ep === "Убийца дюжины") epithetBonus += 2;
      if (ep === "Убийца сотни") epithetBonus += 6;
      if (ep === "Убийца тысячи") epithetBonus += 12;
      if (ep === "Гроза бандитов") epithetBonus += 4;
      if (ep === "Истребитель атаманов") epithetBonus += 8;
      if (ep === "Ниспровергатель королей") epithetBonus += 10;
      if (ep === "Несокрушимый осадник") epithetBonus += 6;
      if (ep === "Легенда меча") epithetBonus += 10;
      if (ep === "Бог войны") epithetBonus += 20;
    }

    // Karma Alignment bonuses
    const savedKarma = player.getDynamicProperty("feudal_karma");
    const karma = typeof savedKarma === "number" ? savedKarma : 0;
    let karmaHpBonus = 0;
    if (karma >= 75) {
      karmaHpBonus += 10;
      player.addEffect("regeneration", 400, { amplifier: 0, showParticles: false });
    } else if (karma >= 35) {
      karmaHpBonus += 6;
    } else if (karma <= -75) {
      karmaHpBonus += 12;
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("resistance", 400, { amplifier: 0, showParticles: false });
    } else if (karma <= -35) {
      karmaHpBonus += 6;
      player.addEffect("strength", 400, { amplifier: 0, showParticles: false });
    }

    const totalBonusHp = titleBonus + epithetBonus + karmaHpBonus;

    // Apply Health Boost effect in Bedrock (4 HP per amplifier tier)
    if (totalBonusHp > 0) {
      const amp = Math.max(0, Math.floor(totalBonusHp / 4) - 1);
      player.addEffect("health_boost", 400, { amplifier: amp, showParticles: false });
    }

    // Apply Passive Skills based on epithets
    if (profile.unlockedEpithets.includes("Убийца дюжины")) {
      player.addEffect("speed", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Убийца сотни")) {
      player.addEffect("resistance", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Убийца тысячи")) {
      player.addEffect("strength", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Истребитель атаманов")) {
      player.addEffect("resistance", 400, { amplifier: 1, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Несокрушимый осадник")) {
      player.addEffect("fire_resistance", 400, { amplifier: 0, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Легенда меча")) {
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("haste", 400, { amplifier: 1, showParticles: false });
    }
    if (profile.unlockedEpithets.includes("Бог войны")) {
      player.addEffect("regeneration", 400, { amplifier: 0, showParticles: false });
      player.addEffect("strength", 400, { amplifier: 1, showParticles: false });
      player.addEffect("resistance", 400, { amplifier: 1, showParticles: false });
    }
  }

  public static saveProfile(profile: RPGProfileData) {
    world.setDynamicProperty(`feudal_rpg_${profile.playerId}`, JSON.stringify(profile));
  }
}
