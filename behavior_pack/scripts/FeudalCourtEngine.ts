import { Player, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { SettlementData, RulerTrait } from "./CityProgression";

export class FeudalCourtEngine {
  private static playerKarma: Map<string, number> = new Map(); // -100 (Black Tyrant) to +100 (Holy Paladin)

  public static getKarma(player: Player): number {
    const saved = player.getDynamicProperty("feudal_karma");
    if (typeof saved === "number") return saved;
    return this.playerKarma.get(player.id) ?? 0;
  }

  public static modifyKarma(player: Player, delta: number) {
    const current = this.getKarma(player);
    const updated = Math.max(-100, Math.min(100, current + delta));
    this.playerKarma.set(player.id, updated);
    player.setDynamicProperty("feudal_karma", updated);

    if (delta > 0) {
      player.sendMessage(`§a[Честь] Ваша рыцарская репутация возросла на +${delta} (Всего: ${updated})!§r`);
    } else if (delta < 0) {
      player.sendMessage(`§c[Бесчестие] Ваша дурная слава усилилась на ${delta} (Всего: ${updated})!§r`);
    }
  }

  public static getCourtReputationTitle(karma: number): string {
    if (karma >= 75) return "✨ Священный Паладин Земли";
    if (karma >= 35) return "🛡️ Благородный Сюзерен";
    if (karma >= -35) return "⚔️ Вольный Феодальный Наемник";
    if (karma >= -75) return "💀 Грозный Завоеватель";
    return "🔥 Кровавый Владыка Тьмы";
  }

  public static openCourtMenu(player: Player, settlement: SettlementData) {
    const trait = settlement.rulerTrait ?? RulerTrait.Honorable;
    const karma = this.getKarma(player);
    const repTitle = this.getCourtReputationTitle(karma);

    let info = `§l§6=== ФЕОДАЛЬНЫЙ ДВОР И ИНТРИГИ ===§r\n\n`;
    info += `§eХарактер правящего монарха:§6 ${trait}§r\n`;
    info += `§eВаш статус при дворе:§b ${repTitle}§r (Карма: ${karma})\n\n`;

    switch (trait) {
      case RulerTrait.Greedy:
        info += `§c«Этот государь ненасытен: налог 35%, народ ропщет, а в казне ломятся сундуки. Горожане готовы восстать, если найдется вожак!»§r\n`;
        break;
      case RulerTrait.Warlord:
        info += `§c«Монарх жаждет крови и славы. Армия держится на пределе мобилизации (50%), катапульты готовы к бою день и ночь!»§r\n`;
        break;
      case RulerTrait.Honorable:
        info += `§a«Праведный правитель. Чтит клятвы, держит налоги на 10%, воины готовы умереть за его знамя.»§r\n`;
        break;
      case RulerTrait.Schemer:
        info += `§e«Мастер тайных ядов и шпионов. Может продать союзника за звонкую монету или отравить колодец осаждающих.»§r\n`;
        break;
      case RulerTrait.Wise:
        info += `§b«Мудрец на троне. Города процветают, науки развиваются, а торговые пошлины минимальны.»§r\n`;
        break;
    }

    const form = new ActionFormData()
      .title("Тайный Совет и Интриги")
      .body(info)
      .button("👑 Присягнуть на верность монарху (+25 Чести)")
      .button("💰 Подкупить коменданта крепости (20 изумрудов)")
      .button("🔥 Поднять восстание против тирана (-30 Чести)")
      .button("📜 Потребовать аудиенции о снижении налогов")
      .button("Назад");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 4) return;

      switch (res.selection) {
        case 0:
          this.modifyKarma(player, 25);
          player.sendMessage(`§a[Присяга] Вы преклонили колено перед троном. Королевство считает вас своим защитником!§r`);
          break;
        case 1:
          this.bribeGarrison(player, settlement);
          break;
        case 2:
          this.inciteRevolt(player, settlement);
          break;
        case 3:
          if (settlement.taxRatePercent > 10) {
            settlement.taxRatePercent = Math.max(10, settlement.taxRatePercent - 5);
            player.sendMessage(`§a[Успех] Ваши речи убедили правителя снизить налоги до ${settlement.taxRatePercent}%! Народ ликует!§r`);
            this.modifyKarma(player, 15);
          } else {
            player.sendMessage("§e[Монарх] Налоги в нашем королевстве и так находятся на минимальном уровне!§r");
          }
          break;
      }
    });
  }

  private static bribeGarrison(player: Player, settlement: SettlementData) {
    const inv = player.getComponent("minecraft:inventory") as any;
    const container = inv?.container;
    if (!container) return;

    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }

    if (emeraldsFound < 20) {
      player.sendMessage("§c[Интрига] Для подкупа коменданта крепости нужно 20 изумрудов!§r");
      return;
    }

    // Deduct 20 emeralds
    let remaining = 20;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") {
        if (it.amount <= remaining) {
          remaining -= it.amount;
          container.setItem(i, undefined);
        } else {
          it.amount -= remaining;
          container.setItem(i, it);
          remaining = 0;
        }
        if (remaining <= 0) break;
      }
    }

    settlement.militaryCount = Math.max(5, settlement.militaryCount - 15);
    player.sendMessage("§6[Подкуп] Комендант открыл боковые ворота и увел часть гарнизона в кабак! Оборона города ослабла на 15 воинов!§r");
  }

  private static inciteRevolt(player: Player, settlement: SettlementData) {
    this.modifyKarma(player, -30);
    world.sendMessage(
      `§c§l[БУНТ!] В городе ${settlement.factionId} вспыхнуло вооруженное крестьянское восстание! Ополченцы штурмуют ратушу!§r`
    );

    // Spawn rebellious peasants/mob near throne
    const dim = player.dimension;
    for (let i = 0; i < 5; i++) {
      try {
        const mob = dim.spawnEntity("feudal:bandit_leader", {
          x: settlement.throneLocation.x + (Math.random() - 0.5) * 6,
          y: settlement.throneLocation.y,
          z: settlement.throneLocation.z + (Math.random() - 0.5) * 6
        });
        mob.nameTag = `Вожак восставших горожан`;
      } catch {}
    }
  }
}
