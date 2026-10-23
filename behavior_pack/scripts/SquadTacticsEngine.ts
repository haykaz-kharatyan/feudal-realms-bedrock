import { Player, world, system, Vector3, Entity } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { SettlementData, CityProgression } from "./CityProgression";

export enum TacticalStance {
  Standard = "Стандартный строй",
  ShieldWall = "Стена щитов (Глухая оборона)",
  AllOutCharge = "Лобовая атака (Натиск)",
  HoldPosition = "Охрана рубежа (Стойкость)"
}

export class SquadTacticsEngine {
  private static playerStances: Map<string, TacticalStance> = new Map();

  /**
   * Opens the tactical commander modal menu
   */
  public static openTacticsMenu(player: Player, settlement?: SettlementData) {
    const currentStance = this.playerStances.get(player.id) ?? TacticalStance.Standard;
    const nearbyTroops = this.getNearbyFriendlyTroops(player, 36);

    let info = `§l§6=== ПОЛЕВОЙ ШТАБ ПОЛКОВОДЦА ===§r\n\n`;
    info += `§eТекущая тактическая стойка:§b ${currentStance}§r\n`;
    info += `§eПодконтрольных воинов поблизости:§a ${nearbyTroops.length} бойцов§r\n`;
    if (settlement) {
      info += `§eГородской резерв армии:§6 ${settlement.militaryCount} воинов (Мобилизация: ${settlement.isMobilized ? "§cДА (50%)" : "§aНЕТ (25%)"}§e)§r\n`;
    }

    const form = new ActionFormData()
      .title("Знамя Полководца: Приказы")
      .body(info)
      .button("🛡️ «Стена щитов!» (Оборона и Сопротивление III)")
      .button("⚔️ «В атаку! Сокрушить врага!» (Сила II и Скорость II)")
      .button("🏹 «Залповый огонь!» (Залп баллист и лучников)")
      .button("🛑 «Держать строй на месте!»")
      .button("📯 «Объявить всеобщую мобилизацию (до 50% жителей)»")
      .button("Закрыть штаб");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 5) return;

      switch (res.selection) {
        case 0:
          this.executeShieldWall(player, nearbyTroops);
          break;
        case 1:
          this.executeCharge(player, nearbyTroops);
          break;
        case 2:
          this.executeVolleyFire(player, nearbyTroops);
          break;
        case 3:
          this.executeHoldPosition(player, nearbyTroops);
          break;
        case 4:
          if (settlement) {
            this.handleMobilizationCall(player, settlement);
          } else {
            player.sendMessage("§c[Штаб] Вы должны находиться в пределах владений вашего города для мобилизации!§r");
          }
          break;
      }
    });
  }

  private static getNearbyFriendlyTroops(player: Player, radius: number): Entity[] {
    const dim = player.dimension;
    try {
      const entities = dim.getEntities({
        location: player.location,
        maxDistance: radius
      });
      return entities.filter((e) => {
        const type = e.typeId;
        return (
          type === "feudal:royal_knight" ||
          type === "feudal:city_guard" ||
          type === "feudal:ballista"
        );
      });
    } catch {
      return [];
    }
  }

  private static executeShieldWall(player: Player, troops: Entity[]) {
    this.playerStances.set(player.id, TacticalStance.ShieldWall);
    world.sendMessage(`§b§l[ПРИКАЗ] ${player.name}: «СМКНУТЬ ЩИТЫ! СТЕНА ЩИТОВ!»§r`);

    for (const unit of troops) {
      try {
        unit.addEffect("resistance", 20 * 45, { amplifier: 2, showParticles: true }); // Resistance III
        unit.addEffect("slowness", 20 * 45, { amplifier: 0, showParticles: false });
      } catch {}
    }

    player.addEffect("resistance", 20 * 45, { amplifier: 1, showParticles: false });

    try {
      player.dimension.spawnParticle("minecraft:totem_particle", {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z
      });
    } catch {}

    player.sendMessage(`§a[Тактика] ${troops.length} воинов выстроились в непробиваемый строй «Стена щитов»!§r`);
  }

  private static executeCharge(player: Player, troops: Entity[]) {
    this.playerStances.set(player.id, TacticalStance.AllOutCharge);
    world.sendMessage(`§c§l[ПРИКАЗ] ${player.name}: «В АТАКУ! СОКРУШИТЬ ИХ СТРОЙ!»§r`);

    for (const unit of troops) {
      try {
        unit.addEffect("speed", 20 * 30, { amplifier: 1, showParticles: true }); // Speed II
        unit.addEffect("strength", 20 * 30, { amplifier: 1, showParticles: true }); // Strength II
      } catch {}
    }

    player.addEffect("speed", 20 * 30, { amplifier: 1, showParticles: false });
    player.addEffect("strength", 20 * 30, { amplifier: 0, showParticles: false });

    try {
      player.dimension.spawnParticle("minecraft:critical_hit_emitter", {
        x: player.location.x,
        y: player.location.y + 1.2,
        z: player.location.z
      });
    } catch {}

    player.sendMessage(`§c[Тактика] Дружина ринулась в яростный натиск! Урон и скорость увеличены!§r`);
  }

  private static executeVolleyFire(player: Player, troops: Entity[]) {
    world.sendMessage(`§e§l[ПРИКАЗ] ${player.name}: «БАЛЛИСТЫ И ЛУЧНИКИ — ЗАЛП ПО МОЕЙ ЦЕЛИ!»§r`);

    const view = player.getViewDirection();
    const pos = player.location;

    // Simulate hail of ballista bolts & arrows
    for (let i = 0; i < 6; i++) {
      system.runTimeout(() => {
        try {
          const arrow = player.dimension.spawnEntity("minecraft:arrow", {
            x: pos.x + (Math.random() - 0.5) * 4,
            y: pos.y + 2.5,
            z: pos.z + (Math.random() - 0.5) * 4
          });
          arrow.applyImpulse({
            x: view.x * 2.2 + (Math.random() - 0.5) * 0.2,
            y: view.y * 2.2 + 0.35,
            z: view.z * 2.2 + (Math.random() - 0.5) * 0.2
          });
        } catch {}
      }, i * 3);
    }

    player.sendMessage("§e[Тактика] Произведен массированный синхронный залп по вражеским позициям!§r");
  }

  private static executeHoldPosition(player: Player, troops: Entity[]) {
    this.playerStances.set(player.id, TacticalStance.HoldPosition);
    world.sendMessage(`§6§l[ПРИКАЗ] ${player.name}: «ДЕРЖАТЬ ЭТОТ РУБЕЖ! НИ ШАГУ НАЗАД!»§r`);

    for (const unit of troops) {
      try {
        unit.addEffect("regeneration", 20 * 20, { amplifier: 1, showParticles: true });
        unit.addEffect("resistance", 20 * 20, { amplifier: 1, showParticles: false });
      } catch {}
    }

    player.sendMessage("§6[Тактика] Войска закрепились на позиции и восстанавливают силы!§r");
  }

  private static handleMobilizationCall(player: Player, settlement: SettlementData) {
    const newState = !settlement.isMobilized;
    const newTotal = CityProgression.toggleMobilization(settlement, newState);

    if (newState) {
      // Spawn Vanguard of Militia around the throne
      const dim = player.dimension;
      const countToSpawn = Math.min(6, Math.floor(newTotal / 40));
      for (let i = 0; i < countToSpawn; i++) {
        try {
          const guard = dim.spawnEntity("feudal:city_guard", {
            x: settlement.throneLocation.x + (i % 3) * 2 - 2,
            y: settlement.throneLocation.y,
            z: settlement.throneLocation.z + Math.floor(i / 3) * 2 - 2
          });
          guard.nameTag = `Ополченец города ${settlement.factionId}`;
        } catch {}
      }
    }
  }
}
