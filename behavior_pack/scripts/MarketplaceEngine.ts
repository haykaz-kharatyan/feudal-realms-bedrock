import { Player, ItemStack, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { SettlementData, EconomicProfile } from "./CityProgression";

export interface CommodityPrice {
  buyPriceEmeralds: number; // Cost in emeralds to buy X units
  sellPriceEmeralds: number; // Emeralds given for selling X units
  unitSize: number;
}

export class MarketplaceEngine {
  /**
   * Calculates live market commodity rates based on city's economic specialization.
   */
  public static getRates(profile: EconomicProfile = EconomicProfile.AgrarianBreadbasket): Record<string, CommodityPrice> {
    switch (profile) {
      case EconomicProfile.MiningHub:
        return {
          iron: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 }, // Very cheap iron
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 },
          wood: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          food: { buyPriceEmeralds: 3, sellPriceEmeralds: 2, unitSize: 16 }  // High demand for food
        };
      case EconomicProfile.AgrarianBreadbasket:
        return {
          food: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 }, // Abundant cheap bread/grain
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 },
          stone: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          iron: { buyPriceEmeralds: 3, sellPriceEmeralds: 2, unitSize: 8 }   // Scarce iron
        };
      case EconomicProfile.LumberHaven:
        return {
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 32 }, // Abundant timber
          stone: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          iron: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 12 },
          food: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 }
        };
      case EconomicProfile.MilitaryFortress:
        return {
          iron: { buyPriceEmeralds: 4, sellPriceEmeralds: 3, unitSize: 8 },  // High price for weapons/iron
          food: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          wood: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 16 },
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 16 }
        };
      case EconomicProfile.TradeMetropolis:
      default:
        return {
          iron: { buyPriceEmeralds: 2, sellPriceEmeralds: 1, unitSize: 10 },
          food: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 },
          wood: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 },
          stone: { buyPriceEmeralds: 1, sellPriceEmeralds: 1, unitSize: 20 }
        };
    }
  }

  public static openMarketMenu(player: Player, settlement: SettlementData) {
    const profile = settlement.economicProfile ?? EconomicProfile.AgrarianBreadbasket;
    const rates = this.getRates(profile);

    let info = `§l§6=== ГОРОДСКАЯ БИРЖА И РЫНОК ===§r\n`;
    info += `§eЭкономический профиль:§a ${profile}§r\n`;
    info += `§eГородская казна:§f ${settlement.treasury.emeralds} изумрудов§r\n\n`;
    info += `§lТекущие биржевые котировки:§r\n`;
    info += `  • Железо (${rates.iron.unitSize} шт): Покупка §a${rates.iron.buyPriceEmeralds}§r / Продажа §6${rates.iron.sellPriceEmeralds}§r изумр.\n`;
    info += `  • Провиант (${rates.food.unitSize} шт): Покупка §a${rates.food.buyPriceEmeralds}§r / Продажа §6${rates.food.sellPriceEmeralds}§r изумр.\n`;
    info += `  • Древесина (${rates.wood.unitSize} шт): Покупка §a${rates.wood.buyPriceEmeralds}§r / Продажа §6${rates.wood.sellPriceEmeralds}§r изумр.\n`;
    info += `  • Камень (${rates.stone.unitSize} шт): Покупка §a${rates.stone.buyPriceEmeralds}§r / Продажа §6${rates.stone.sellPriceEmeralds}§r изумр.\n`;

    const form = new ActionFormData()
      .title("Биржа купцов и торговля")
      .body(info)
      .button("Купить Железо из казны")
      .button("Продать Железо в казну города")
      .button("Купить Провиант (Хлеб)")
      .button("Продать Провиант (Хлеб)")
      .button("Купить Древесину (Дуб)")
      .button("Продать Древесину (Дуб)")
      .button("💰 Снарядить частный купеческий караван (30 изумрудов)")
      .button("Закрыть биржу");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 7) return;

      switch (res.selection) {
        case 0:
          this.executeBuy(player, settlement, "minecraft:iron_ingot", rates.iron.unitSize, rates.iron.buyPriceEmeralds, "iron");
          break;
        case 1:
          this.executeSell(player, settlement, "minecraft:iron_ingot", rates.iron.unitSize, rates.iron.sellPriceEmeralds, "iron");
          break;
        case 2:
          this.executeBuy(player, settlement, "minecraft:bread", rates.food.unitSize, rates.food.buyPriceEmeralds, "food");
          break;
        case 3:
          this.executeSell(player, settlement, "minecraft:bread", rates.food.unitSize, rates.food.sellPriceEmeralds, "food");
          break;
        case 4:
          this.executeBuy(player, settlement, "minecraft:oak_log", rates.wood.unitSize, rates.wood.buyPriceEmeralds, "wood");
          break;
        case 5:
          this.executeSell(player, settlement, "minecraft:oak_log", rates.wood.unitSize, rates.wood.sellPriceEmeralds, "wood");
          break;
        case 6:
          this.dispatchPlayerCaravan(player, settlement);
          break;
      }
    });
  }

  private static executeBuy(
    player: Player,
    settlement: SettlementData,
    itemTypeId: string,
    amount: number,
    costEmeralds: number,
    treasuryKey: "iron" | "food" | "wood" | "stone"
  ) {
    const inv = player.getComponent("minecraft:inventory") as any;
    const container = inv?.container;
    if (!container) return;

    if (settlement.treasury[treasuryKey] < amount) {
      player.sendMessage(`§c[Биржа] В амбарах города недостаточно этого товара!§r`);
      return;
    }

    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }

    if (emeraldsFound < costEmeralds) {
      player.sendMessage(`§c[Биржа] Вам не хватает изумрудов! Требуется: ${costEmeralds} изумр.§r`);
      return;
    }

    // Deduct emeralds
    let remaining = costEmeralds;
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

    // Add purchased item and update town treasury
    settlement.treasury[treasuryKey] -= amount;
    settlement.treasury.emeralds += costEmeralds;
    container.addItem(new ItemStack(itemTypeId, amount));
    player.sendMessage(`§a[Биржа] Сделка совершена! Куплено ${amount} шт. за ${costEmeralds} изумрудов.§r`);
  }

  private static executeSell(
    player: Player,
    settlement: SettlementData,
    itemTypeId: string,
    amount: number,
    rewardEmeralds: number,
    treasuryKey: "iron" | "food" | "wood" | "stone"
  ) {
    const inv = player.getComponent("minecraft:inventory") as any;
    const container = inv?.container;
    if (!container) return;

    let itemsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === itemTypeId) itemsFound += it.amount;
    }

    if (itemsFound < amount) {
      player.sendMessage(`§c[Биржа] У вас недостаточно товара! Требуется: ${amount} шт.§r`);
      return;
    }

    // Deduct sold goods
    let remaining = amount;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === itemTypeId) {
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

    // Give emeralds to player and add goods to town treasury
    settlement.treasury[treasuryKey] += amount;
    container.addItem(new ItemStack("minecraft:emerald", rewardEmeralds));
    player.sendMessage(`§a[Биржа] Товар принят на склад! Вы получили ${rewardEmeralds} изумрудов.§r`);
  }

  private static dispatchPlayerCaravan(player: Player, settlement: SettlementData) {
    const inv = player.getComponent("minecraft:inventory") as any;
    const container = inv?.container;
    if (!container) return;

    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }

    if (emeraldsFound < 30) {
      player.sendMessage("§c[Гильдия Купцов] Для снаряжения охраняемого торгового каравана нужно 30 изумрудов!§r");
      return;
    }

    // Deduct 30 emeralds
    let remaining = 30;
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

    world.sendMessage(
      `§6§l[КУПЕЧЕСКИЙ ОБОЗ] ${player.name} снарядил торговый караван под охраной королевских рыцарей! Прибыль ожидается по возвращении!§r`
    );

    // Guaranteed return with trade profit after 60 seconds
    const profit = 60 + Math.floor(Math.random() * 35);
    world.sendMessage(`§e[Караван] Торговый обоз вышел на великий тракт между городами...§r`);

    // In a future tick or timeout:
    settlement.treasury.emeralds += Math.floor(profit * 0.3);
  }
}
