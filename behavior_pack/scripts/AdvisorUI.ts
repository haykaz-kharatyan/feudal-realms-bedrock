import { Player, ItemStack, world } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { CityProgression, SettlementData, CityTier, EconomicProfile, RulerTrait } from "./CityProgression";
import { FactionManager } from "./FactionManager";
import { MilitaryCareer } from "./MilitaryCareer";
import { WorldMapUI } from "./WorldMapUI";
import { ColonizationEngine } from "./ColonizationEngine";
import { BorderManager } from "./BorderManager";
import { PlayerRPGProfile } from "./PlayerRPGProfile";
import { AllianceSystem } from "./AllianceSystem";
import { SquadTacticsEngine } from "./SquadTacticsEngine";
import { MarketplaceEngine } from "./MarketplaceEngine";
import { FeudalCourtEngine } from "./FeudalCourtEngine";
import { WorldEventsEngine } from "./WorldEventsEngine";
import { CastleArchitectureEngine, CastleScale } from "./CastleArchitectureEngine";
import { MedievalWallEngine } from "./MedievalWallEngine";

export class AdvisorUI {
  public static openMainMenu(player: Player, settlement: SettlementData) {
    const faction = FactionManager.getFaction(settlement.factionId);
    const border = BorderManager.updateBordersForSettlement(settlement);
    const rpg = PlayerRPGProfile.getProfile(player);
    const currentEvent = WorldEventsEngine.getCurrentEvent();
    const profile = settlement.economicProfile ?? EconomicProfile.AgrarianBreadbasket;
    const trait = settlement.rulerTrait ?? RulerTrait.Honorable;

    let body = `§l§6Титул правителя:§r ${faction?.title ?? "Вождь"} ${faction?.rulerName ?? ""} (§e${trait}§r)\n`;
    body += `§l§eЭпоха города:§r ${CityTier[settlement.tier]} (Рубеж: §6${border.cityRadius} бл.§r)\n`;
    body += `§l§bНаселение:§r §f${settlement.population} чел.§r | Гарнизон: §c${settlement.militaryCount} воинов§r (${settlement.isMobilized ? "§cМОБИЛИЗАЦИЯ 50%" : "§aМИР 25%"}§r)\n`;
    body += `§l§3Профиль:§r ${profile}\n`;
    body += `§l§aКазна:§r ${settlement.treasury.emeralds} изумр. | ${settlement.treasury.wood} дер. | ${settlement.treasury.stone} кам. | ${settlement.treasury.iron} жел. | ${settlement.treasury.food} еды\n`;
    body += `§l§dСобытие мира:§r §e${currentEvent.name}§r\n`;

    const form = new ActionFormData()
      .title(`Советник: ${faction?.name ?? "Поселение"}`)
      .body(body)
      .button("Повысить уровень поселения")
      .button("🏰 Возвести/Перестроить Королевский Замок")
      .button("🧱 Возвести средневековые стены и башни с баллистами")
      .button("🚩 Тактические приказы и Знамя полководца")
      .button("⚖️ Городская биржа и Торговый Рынок")
      .button("👑 Феодальный двор, интриги и заговоры")
      .button("🏆 Глобальные события мира и турниры")
      .button("⚔️ Профиль героя, боевые эпитеты и карма")
      .button("🤝 Военные альянсы и союзы кланов")
      .button("🏹 Разместить оборонительную баллисту (80 дер, 40 жел)")
      .button("🛡️ Нанять рыцаря в личную дружину (15 изумрудов)")
      .button("Дипломатия и договоры с соседями")
      .button("Доска королевских заказов (Квесты)")
      .button("Снарядить колонизацию далеких земель")
      .button("Открыть Королевский Атлас и Карту")
      .button("Получить суточное жалование воина")
      .button("Сдать трофей (Голова атамана)")
      .button("Закрыть");

    form.show(player).then((response) => {
      if (response.canceled) return;

      switch (response.selection) {
        case 0:
          this.handleUpgrade(player, settlement);
          break;
        case 1:
          this.openCastleConstructionMenu(player, settlement);
          break;
        case 2:
          MedievalWallEngine.constructFortifiedCitadelPerimeter(settlement);
          player.sendMessage("§a[Зодчий] Каменщики приступили к возведению средневековых стен, бастионов и баллист!§r");
          break;
        case 3:
          SquadTacticsEngine.openTacticsMenu(player, settlement);
          break;
        case 4:
          MarketplaceEngine.openMarketMenu(player, settlement);
          break;
        case 5:
          FeudalCourtEngine.openCourtMenu(player, settlement);
          break;
        case 6:
          this.openWorldEventsMenu(player);
          break;
        case 7:
          this.openHeroSheet(player);
          break;
        case 8:
          this.openAlliancesMenu(player, settlement);
          break;
        case 9:
          this.buildWallBallista(player, settlement);
          break;
        case 10:
          this.hireRetinueKnight(player);
          break;
        case 11:
          this.openDiplomacyMenu(player, settlement);
          break;
        case 12:
          this.openQuestBoard(player, settlement);
          break;
        case 13:
          this.handleColonization(player, settlement);
          break;
        case 14:
          WorldMapUI.openRealmMap(player);
          break;
        case 15:
          MilitaryCareer.claimDailySalary(player);
          break;
        case 16:
          MilitaryCareer.turnInBanditBounty(player);
          break;
      }
    });
  }

  private static openCastleConstructionMenu(player: Player, settlement: SettlementData) {
    const form = new ActionFormData()
      .title("Королевский Архитектор: Замки")
      .body("Выберите масштаб возводимого замкового комплекса вокруг трона:")
      .button("👑 КОЛОССАЛЬНЫЙ ИМПЕРСКИЙ КРЕМЛЬ-ЦИТАДЕЛЬ (200х200 блоков!)")
      .button("🏰 Великая герцогская крепость (100х100 блоков)")
      .button(`🏰 Замок по текущей эпохе города (${CityTier[settlement.tier]})`)
      .button("Назад");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 3) return;
      if (res.selection === 0) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement, CastleScale.GrandCitadel200x200);
        player.sendMessage("§6§l[ИМПЕРСКИЙ КРЕМЛЬ] Зодчие начали возведение колоссальной цитадели 200х200 блоков с 8 бастионами, стенами и дворцом!§r");
      } else if (res.selection === 1) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement, CastleScale.DucalKeep);
        player.sendMessage("§a[Зодчий] Строительство герцогской крепости 100х100 блоков началось!§r");
      } else if (res.selection === 2) {
        CastleArchitectureEngine.constructOrUpgradeCastle(settlement);
        player.sendMessage(`§a[Зодчий] Строительство замка эпохи ${CityTier[settlement.tier]} началось вокруг трона!§r`);
      }
    });
  }

  private static openWorldEventsMenu(player: Player) {
    const ev = WorldEventsEngine.getCurrentEvent();
    let text = `§l§6=== ЛЕТОПИСЬ МИРА И ГЛОБАЛЬНЫХ СОБЫТИЙ ===§r\n\n`;
    text += `§eТекущее событие:§f ${ev.name}§r\n`;
    text += `§7${ev.description}§r\n\n`;
    text += `§eДлительность:§b ~${Math.ceil(ev.ticksRemaining / 20)} сек.§r\n\n`;
    text += `§6Возможные события эпохи:§r\n`;
    text += `  • §cВторжение Степной Орды§r (нашествие сотен всадников и катапульт)\n`;
    text += `  • §6Великий Рыцарский Турнир§r (дуэли чемпионов за куш в 100 изумрудов)\n`;
    text += `  • §5Великая Чума§r (моровое поветрие и взлет цен на провиант)\n`;
    text += `  • §aЗолотая Лихорадка§r (удвоение богатств шахтерских городов)\n`;
    text += `  • §cКрестьянский Бунт§r (восстания горожан против жадных лордов)\n`;

    const form = new MessageFormData()
      .title("События и Турниры Мира")
      .body(text)
      .button1("Принять к сведению")
      .button2("Назад");

    form.show(player).then(() => {});
  }

  private static buildWallBallista(player: Player, settlement: SettlementData) {
    if (settlement.treasury.wood < 80 || settlement.treasury.iron < 40) {
      player.sendMessage("§c[Гарнизон] Для возведения защитной баллисты требуется 80 дерева и 40 железа в казне!§r");
      return;
    }

    settlement.treasury.wood -= 80;
    settlement.treasury.iron -= 40;

    try {
      const ballista = player.dimension.spawnEntity("feudal:ballista", {
        x: player.location.x,
        y: player.location.y,
        z: player.location.z
      });
      ballista.nameTag = `Защитная баллиста города ${settlement.factionId}`;
      player.sendMessage("§a[Гарнизон] Тяжелая оборонительная баллиста установлена на боевой рубеж!§r");
    } catch {
      player.sendMessage("§c[Ошибка] Не удалось разместить орудие в данной точке.§r");
    }
  }

  private static openHeroSheet(player: Player) {
    const rpg = PlayerRPGProfile.getProfile(player);
    PlayerRPGProfile.applyHealthAndPassives(player, rpg);
    const karma = FeudalCourtEngine.getKarma(player);
    const repTitle = FeudalCourtEngine.getCourtReputationTitle(karma);

    let info = `§l§6=== ЛИЧНОЕ ДЕЛО ВОИТЕЛЯ ===§r\n\n`;
    info += `§eИмя:§f ${player.name}§r\n`;
    info += `§eФеодальный титул:§a ${rpg.feudalTitle}§r\n`;
    info += `§eПридворный статус:§b ${repTitle}§r (Карма: ${karma})\n`;
    info += `§eПовержено рядовых врагов:§f ${rpg.regularKills}§r\n`;
    info += `§eСражено главарей разбойников:§c ${rpg.banditBossKills}§r\n`;
    info += `§eСвергнуто вражеских правителей:§d ${rpg.rulerKills}§r\n`;
    info += `§eУничтожено осадных машин:§6 ${rpg.siegeKills}§r\n\n`;

    info += `§l§6ОТКРЫТЫЕ БОЕВЫЕ ЭПИТЕТЫ:§r\n`;
    if (rpg.unlockedEpithets.length === 0) {
      info += `§7Пока нет открытых эпитетов. Сражайтесь с бандитами и боссами, чтобы заслужить славу!§r\n`;
    } else {
      for (const ep of rpg.unlockedEpithets) {
        info += `  ✨ §b«${ep}»§r\n`;
      }
    }

    const form = new MessageFormData()
      .title("Характеристики героя (MMO RPG)")
      .body(info)
      .button1("Ок")
      .button2("Назад");

    form.show(player).then(() => {});
  }

  private static hireRetinueKnight(player: Player) {
    const inv = player.getComponent("minecraft:inventory") as any;
    const container = inv?.container;
    if (!container) return;

    let emeraldsFound = 0;
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && it.typeId === "minecraft:emerald") emeraldsFound += it.amount;
    }

    if (emeraldsFound < 15) {
      player.sendMessage("[Казарма] Найм элитного рыцаря стоит 15 изумрудов!");
      return;
    }

    // Deduct 15 emeralds
    let remaining = 15;
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

    // Spawn royal knight near player
    try {
      const knight = player.dimension.spawnEntity("feudal:royal_knight", {
        x: player.location.x + 1,
        y: player.location.y,
        z: player.location.z + 1
      });
      knight.nameTag = `Гвардеец дружины ${player.name}`;
      player.sendMessage("§a[Дружина] Элитный рыцарь присягнул вам на верность и следует за вами в бой!§r");
    } catch {
      // spawn failed
    }
  }

  private static openAlliancesMenu(player: Player, settlement: SettlementData) {
    const alliances = AllianceSystem.getAllAlliances();
    let text = `§l§6АКТИВНЫЕ ВОЕННЫЕ СОЮЗЫ И ОРДЫ:§r\n\n`;

    for (const al of alliances.values()) {
      const type = al.isBanditConfederacy ? "§c[БАНДИТСКАЯ ОРДА]§r" : "§b[СВЯЩЕННАЯ ЛИГА]§r";
      text += `${type} §e«${al.name}»§r\n`;
      text += `  • Лидер: ${al.leaderFactionId} | Сила армии: §c${al.totalArmyStrength}§r\n`;
      text += `  • Члены: ${al.memberFactionIds.join(", ")}\n\n`;
    }

    const form = new ActionFormData()
      .title("Военные Альянсы")
      .body(text)
      .button("Создать новую Священную Коалицию")
      .button("Призвать армию союзников на помощь")
      .button("Назад");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 2) return;
      if (res.selection === 0) {
        AllianceSystem.createAlliance(
          `Великая Коалиция ${settlement.factionId}`,
          settlement.factionId,
          [settlement.factionId, "fact_kingdom_1"],
          false
        );
        player.sendMessage("[Дипломатия] Новый военный альянс провозглашен!");
      } else if (res.selection === 1) {
        player.sendMessage("§b[Горн] Союзные отряды выдвинулись на соединение с вашим гарнизоном!§r");
      }
    });
  }

  private static handleUpgrade(player: Player, settlement: SettlementData) {
    if (CityProgression.canUpgrade(settlement)) {
      CityProgression.upgradeTier(settlement);
      BorderManager.updateBordersForSettlement(settlement);
    } else {
      player.sendMessage("[Советник] Нам не хватает ресурсов или людей для перехода в следующую эпоху!");
    }
  }

  private static openDiplomacyMenu(player: Player, settlement: SettlementData) {
    const form = new ActionFormData()
      .title("Дипломатическая Палата")
      .body("Выберите действие во внешней политике с соседними фракциями:")
      .button("Заключить Торговый Союз (Торговля мулами и кораблями)")
      .button("Предложить Вассалитет (Сбор дани)")
      .button("Пакт о ненападении")
      .button("Объявить Феодальную Войну клану")
      .button("Назад");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 4) return;
      switch (res.selection) {
        case 0:
          player.sendMessage("[Дипломат] Торговый союз скреплен печатью! Торговые обозы и когги вышли на маршрут.");
          settlement.treasury.emeralds += 20;
          break;
        case 1:
          player.sendMessage("[Дипломат] Посланник отправлен с предложением вассальной клятвы.");
          break;
        case 2:
          player.sendMessage("[Дипломат] Пакт о ненападении подписан сроком на 30 игровых дней.");
          break;
        case 3:
          player.sendMessage("§c[ВОЙНА] Трубите в боевой рог! Объявлен поход против разбойников!§r");
          break;
      }
    });
  }

  private static openQuestBoard(player: Player, settlement: SettlementData) {
    const form = new ActionFormData()
      .title("Доска Королевских Заказов")
      .body("Город нуждается в помощи смелых авантюристов:")
      .button("Заказ лесопилки: Сдать 64 дубовых бревна (+16 изумрудов)")
      .button("Заказ каменоломни: Сдать 64 булыжника (+12 изумрудов)")
      .button("Зачистка тракта: Уничтожить засаду бандитов (+30 изумрудов)")
      .button("Назад");

    form.show(player).then((res) => {
      if (res.canceled || res.selection === 3) return;
      const inv = player.getComponent("minecraft:inventory") as any;
      const container = inv?.container;
      if (!container) return;

      if (res.selection === 0) {
        container.addItem(new ItemStack("minecraft:emerald", 16));
        settlement.treasury.wood += 64;
        player.sendMessage("[Староста] Лесопилка пополнена древесиной! Награда выдана.");
      } else if (res.selection === 1) {
        container.addItem(new ItemStack("minecraft:emerald", 12));
        settlement.treasury.stone += 64;
        player.sendMessage("[Каменоломня] Булыжник принят в казну! Награда выдана.");
      } else if (res.selection === 2) {
        MilitaryCareer.addVictory(player);
        container.addItem(new ItemStack("minecraft:emerald", 30));
        player.sendMessage("[Маршал] Засада подавлена! Военная слава возросла.");
      }
    });
  }

  private static handleColonization(player: Player, settlement: SettlementData) {
    if (!ColonizationEngine.canColonize(settlement)) {
      player.sendMessage(
        "[Советник] Для колонизации далеких земель город должен достичь 4 эпохи (Город-крепость), а в казне должно быть 400 дерева, 250 камня, 150 еды, 40 изумрудов и от 30 жителей!"
      );
      return;
    }

    const modal = new ModalFormData()
      .title("Снарядить Колонизационную Экспедицию")
      .textField("Название нового поселения:", "Новый Эдинбург", "Новая Колония");

    modal.show(player).then((res) => {
      if (res.canceled) return;
      const colonyName = (res.formValues?.[0] as string) || "Новая Колония";
      ColonizationEngine.launchExpedition(settlement, colonyName);
    });
  }
}
