import { Player, ItemStack, world, EntityInventoryComponent } from "@minecraft/server";

export enum MilitaryRank {
  Recruit = "Рекрут",
  Sergeant = "Сержант",
  Captain = "Капитан Гарнизона",
  General = "Генерал Армии",
  FieldMarshal = "Великий Маршал"
}

export interface PlayerMilitaryProfile {
  playerId: string;
  rank: MilitaryRank;
  victories: number;
  lastSalaryDay: number;
  allegianceCityId: string;
}

export class MilitaryCareer {
  private static profiles: Map<string, PlayerMilitaryProfile> = new Map();

  private static salaryByRank: Record<MilitaryRank, number> = {
    [MilitaryRank.Recruit]: 4,
    [MilitaryRank.Sergeant]: 8,
    [MilitaryRank.Captain]: 16,
    [MilitaryRank.General]: 32,
    [MilitaryRank.FieldMarshal]: 64
  };

  public static getProfile(player: Player, defaultCityId = "city_1"): PlayerMilitaryProfile {
    let profile = this.profiles.get(player.id);
    if (!profile) {
      profile = {
        playerId: player.id,
        rank: MilitaryRank.Recruit,
        victories: 0,
        lastSalaryDay: -1,
        allegianceCityId: defaultCityId
      };
      this.profiles.set(player.id, profile);
    }
    return profile;
  }

  public static claimDailySalary(player: Player) {
    const profile = this.getProfile(player);
    const currentDay = Math.floor(world.getDay());

    if (profile.lastSalaryDay >= currentDay) {
      player.sendMessage("[Казарма] Вы уже получили своё суточное жалованье за сегодня!");
      return;
    }

    const salaryAmount = this.salaryByRank[profile.rank];
    profile.lastSalaryDay = currentDay;

    const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined;
    const container = inventory?.container;
    if (container) {
      container.addItem(new ItemStack("minecraft:emerald", salaryAmount));
      player.sendMessage(`[Казарма] Получено жалование за звание ${profile.rank}: ${salaryAmount} изумрудов!`);
    }
  }

  public static addVictory(player: Player) {
    const profile = this.getProfile(player);
    profile.victories++;

    if (profile.victories >= 25 && profile.rank !== MilitaryRank.FieldMarshal) {
      profile.rank = MilitaryRank.FieldMarshal;
      world.sendMessage(`[Указ Короля] ${player.name} удостоен высшего звания: ${MilitaryRank.FieldMarshal}!`);
    } else if (profile.victories >= 15 && profile.rank === MilitaryRank.Captain) {
      profile.rank = MilitaryRank.General;
      player.sendMessage(`[Казарма] Поздравляем! Вам присвоено звание ${MilitaryRank.General}!`);
    } else if (profile.victories >= 5 && profile.rank === MilitaryRank.Recruit) {
      profile.rank = MilitaryRank.Sergeant;
      player.sendMessage(`[Казарма] Поздравляем! Вам присвоено звание ${MilitaryRank.Sergeant}!`);
    }
  }

  public static turnInBanditBounty(player: Player) {
    const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined;
    const container = inventory?.container;
    if (!container) return;

    let headFound = false;
    let slotIndex = -1;

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (item && item.typeId === "feudal:bandit_head") {
        headFound = true;
        slotIndex = i;
        break;
      }
    }

    if (!headFound || slotIndex === -1) {
      player.sendMessage("[Староста] У вас в инвентаре нет трофейной головы атамана!");
      return;
    }

    const item = container.getItem(slotIndex)!;
    if (item.amount > 1) {
      item.amount -= 1;
      container.setItem(slotIndex, item);
    } else {
      container.setItem(slotIndex, undefined);
    }

    container.addItem(new ItemStack("minecraft:emerald", 32));
    this.addVictory(player);

    world.sendMessage(`[Награда за голову] ${player.name} сдал трофей атамана и получил 32 изумруда!`);
  }
}
