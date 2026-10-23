import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(width, height, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk("IHDR", ihdrData);

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a ?? 255;
    }
  }
  const idat = makeChunk("IDAT", zlib.deflateSync(raw));
  const iend = makeChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function savePng(filepath, width, height, getPixel) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pngBuf = createPng(width, height, getPixel);
  fs.writeFileSync(filepath, pngBuf);
  console.log(`[Texture] Saved ${filepath} (${width}x${height})`);
}

// 1. Feudal Ruler (64x64)
savePng("resource_pack/textures/entity/feudal_ruler.png", 64, 64, (x, y) => {
  // Head region (0..31, 0..15)
  if (x < 32 && y < 16) {
    if (x >= 8 && x < 16 && y >= 8 && y < 16) {
      // Face front
      if (y === 11 && (x === 10 || x === 13)) return [50, 100, 200, 255]; // blue eyes
      if (y === 13 && x >= 10 && x <= 13) return [140, 70, 50, 255]; // mouth/beard
      return [230, 190, 160, 255]; // skin
    }
    // Hair
    return [160, 120, 70, 255];
  }
  // Crown (0..63, 48..63)
  if (y >= 48) {
    if ((x + y) % 5 === 0) return [220, 40, 40, 255]; // ruby gem
    if ((x * y) % 7 === 0) return [255, 255, 180, 255]; // highlight
    return [240, 195, 30, 255]; // pure royal gold
  }
  // Royal tunic & mantle (rest)
  if (y >= 16 && y < 32) {
    if (x >= 20 && x < 28) {
      // Royal crimson chest with gold embroidery
      if (x === 23 || x === 24 || y === 20 || y === 28) return [240, 195, 30, 255]; // gold trim
      return [170, 25, 45, 255]; // crimson velvet
    }
  }
  // Royal cape / fur (32..47)
  if (y >= 32 && y < 48) {
    if (y >= 44 && (x % 4 === 0)) return [20, 20, 20, 255]; // ermine black spot
    if (y >= 43) return [245, 245, 245, 255]; // ermine white fur
    return [140, 15, 35, 255]; // dark royal velvet
  }
  // Default royal gold/crimson
  return [160, 30, 40, 255];
});

// 2. Bandit Leader (64x64)
savePng("resource_pack/textures/entity/bandit_leader.png", 64, 64, (x, y) => {
  // Face front (8..15, 8..15)
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (x === 10 && y === 11) return [40, 40, 40, 255]; // eyepatch
    if (x === 13 && y === 11) return [230, 60, 40, 255]; // glowing red eye
    if (y === 10 && x === 10) return [30, 30, 30, 255]; // eyepatch strap
    if (y >= 12) return [60, 50, 45, 255]; // dark rough beard
    return [195, 150, 125, 255]; // rugged skin
  }
  // Horns & Spikes (0..19, 32..47)
  if (x < 20 && y >= 32 && y < 48) {
    if (y < 36) return [215, 205, 185, 255]; // bone horn tip
    return [90, 80, 70, 255]; // horn base
  }
  // Heavy armor chest (16..39, 16..31)
  if (x >= 16 && x < 40 && y >= 16 && y < 32) {
    if ((x + y) % 4 === 0) return [90, 95, 100, 255]; // iron stud
    if (y >= 26) return [45, 35, 30, 255]; // wide leather belt
    return [65, 70, 75, 255]; // dark steel plate
  }
  // Greaves and boots
  if (y >= 48) {
    return [40, 42, 46, 255];
  }
  return [70, 55, 45, 255]; // dark leather
});

// 3. City Guard (64x64)
savePng("resource_pack/textures/entity/city_guard.png", 64, 64, (x, y) => {
  // Face / Visor (8..15, 8..15)
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && x >= 9 && x <= 14) return [20, 25, 35, 255]; // helmet visor slit
    if (y === 12 && (x === 11 || x === 12)) return [100, 180, 255, 255]; // visor glow
    return [160, 165, 175, 255]; // steel helmet
  }
  // Helmet Crest (0..15, 48..63)
  if (x < 16 && y >= 48) {
    return [190, 30, 30, 255]; // red plume / knight crest
  }
  // Body Chest with tabard (16..39, 16..31)
  if (x >= 16 && x < 40 && y >= 16 && y < 32) {
    // Red tabard with white cross
    if (x >= 20 && x < 28) {
      if (x === 23 || x === 24 || y === 22 || y === 23) return [240, 240, 245, 255]; // white cross
      return [180, 35, 35, 255]; // red knight tabard
    }
    return [150, 155, 165, 255]; // polished steel plate
  }
  // Arms & Legs (steel chainmail / plate)
  if ((x + y) % 2 === 0) return [175, 180, 190, 255];
  return [140, 145, 155, 255];
});

// 4. Advisor (64x64)
savePng("resource_pack/textures/entity/advisor.png", 64, 64, (x, y) => {
  // Face
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 10 && (x === 10 || x === 13)) return [70, 140, 90, 255]; // wise green eyes
    if (y >= 12) return [220, 220, 225, 255]; // majestic grey beard
    return [235, 195, 165, 255];
  }
  // Robes (emerald green scholar robes with golden borders)
  if (y >= 16) {
    if (x === 20 || x === 27 || y === 30 || y === 45) return [235, 195, 40, 255]; // gold trim
    if ((x + y) % 6 === 0) return [30, 120, 75, 255];
    return [20, 95, 55, 255]; // deep emerald scholar robe
  }
  // Hair / hood
  return [200, 200, 205, 255];
});

// 5. Heraldic Banner (64x64)
savePng("resource_pack/textures/entity/heraldic_banner.png", 64, 64, (x, y) => {
  // Wood pole (0..7, 0..39)
  if (x < 8 && y < 40) {
    return [120, 80, 45, 255]; // carved oak wood
  }
  // Gold finial (0..7, 40..47)
  if (x < 8 && y >= 40 && y < 48) {
    return [245, 200, 35, 255]; // gold eagle tip
  }
  // Cloth banner (16..47, 16..47)
  if (x >= 16 && x < 48 && y >= 16 && y < 48) {
    const qx = x >= 32;
    const qy = y >= 32;
    // Quartered shield banner: Gold and Royal Azure
    const isGold = (qx ^ qy) === 0;
    if (isGold) {
      if ((x === 24 && y === 24) || (x === 40 && y === 40)) return [180, 30, 30, 255]; // emblem
      return [235, 190, 30, 255];
    } else {
      if ((x === 40 && y === 24) || (x === 24 && y === 40)) return [245, 245, 250, 255]; // silver fleur
      return [30, 75, 160, 255];
    }
  }
  return [40, 40, 40, 255];
});

// 6. Trophy Bandit Head Item (16x16)
savePng("resource_pack/textures/items/bandit_head.png", 16, 16, (x, y) => {
  // Transparent border
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Chieftain horns on top
  if (y <= 3 && (x === 2 || x === 3 || x === 12 || x === 13)) return [215, 200, 180, 255];
  // Eyepatch
  if (y === 6 && x >= 4 && x <= 6) return [30, 30, 30, 255];
  // Glowing eye
  if (y === 6 && x === 10) return [240, 40, 30, 255];
  // Rough beard
  if (y >= 9 && y <= 12 && x >= 4 && x <= 11) return [55, 45, 40, 255];
  // Bloody neck base
  if (y >= 13 && x >= 5 && x <= 10) return [170, 20, 20, 255];
  // Head skin
  if (x >= 4 && x <= 11 && y >= 4 && y <= 8) return [190, 145, 120, 255];
  return [0, 0, 0, 0];
});

// 7. Throne Block (64x64)
savePng("resource_pack/textures/blocks/throne.png", 64, 64, (x, y) => {
  // Velvet seat cushion (0..31, 16..31)
  if (x < 32 && y >= 16 && y < 32) {
    if ((x + y) % 8 === 0) return [240, 195, 30, 255]; // gold button in quilted cushion
    if ((x + y) % 4 === 0) return [140, 15, 30, 255];
    return [175, 25, 45, 255]; // crimson royal velvet
  }
  // Gold carved backrest crest
  if (x >= 32 && y >= 32) {
    if ((x * y) % 5 === 0) return [255, 255, 180, 255];
    return [240, 195, 35, 255]; // ornate gold
  }
  // Carved grey marble base
  if ((x + y) % 7 === 0) return [160, 165, 175, 255];
  return [130, 135, 145, 255];
});

// 8. Pack Icon (128x128) - Saved to both BP and RP
const iconPng = createPng(128, 128, (x, y) => {
  const dx = x - 64;
  const dy = y - 64;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer dark background vignette
  if (dist > 58) return [18, 20, 26, 255];
  if (dist > 54) return [220, 180, 40, 255]; // Gold ring border

  // Shield inside
  if (y >= 28 && y <= 96 && Math.abs(dx) <= 38) {
    const isLeft = dx < 0;
    const isTop = y < 62;
    // Quartered heraldic shield
    if (isLeft ^ isTop) {
      // Royal blue
      return [35, 75, 160, 255];
    } else {
      // Crimson
      return [180, 30, 40, 255];
    }
  }

  // Golden Crown on top of shield (y: 20..38, x: 44..84)
  if (y >= 18 && y <= 34 && Math.abs(dx) <= 24) {
    if ((x + y) % 3 === 0) return [255, 255, 200, 255];
    return [245, 200, 35, 255];
  }

  // Crossed swords diagonal
  if (Math.abs(dx - (dy - 10)) <= 2 || Math.abs(dx + (dy - 10)) <= 2) {
    if (y < 35 || y > 90) return [225, 230, 240, 255]; // steel blade
    return [240, 195, 40, 255]; // sword hilt
  }

  return [26, 30, 38, 255]; // Dark slate banner background
});

fs.writeFileSync("resource_pack/pack_icon.png", iconPng);
fs.writeFileSync("behavior_pack/pack_icon.png", iconPng);
console.log("[Texture] Saved pack_icon.png to resource_pack and behavior_pack (128x128)");

// 9. Miner (64x64)
savePng("resource_pack/textures/entity/miner.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && (x === 10 || x === 13)) return [40, 40, 50, 255];
    if ((x + y) % 5 === 0) return [70, 70, 75, 255]; // coal dust smear
    return [215, 175, 145, 255];
  }
  if (y >= 48) {
    if (x >= 36 && x <= 39 && y >= 48 && y <= 51) return [255, 230, 80, 255]; // lantern light
    if (x >= 35 && x <= 40 && y >= 48 && y <= 52) return [120, 110, 80, 255]; // brass rim
    return [220, 160, 25, 255]; // industrial yellow helmet
  }
  if (y >= 16 && y < 32) {
    if (x >= 20 && x < 28) {
      if (x === 21 || x === 26) return [50, 75, 120, 255]; // suspenders
      return [110, 115, 120, 255];
    }
  }
  if (y >= 32) return [45, 65, 105, 255]; // denim overalls
  return [90, 95, 100, 255];
});

// 10. Lumberjack (64x64)
savePng("resource_pack/textures/entity/lumberjack.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y >= 11 && x >= 8 && x <= 15) return [130, 65, 30, 255]; // ginger lumberjack beard
    if (y === 10 && (x === 10 || x === 13)) return [50, 110, 160, 255];
    return [225, 180, 150, 255];
  }
  if (y >= 16 && y < 32) {
    const isPlaidRed = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
    return isPlaidRed ? [190, 35, 35, 255] : [35, 35, 40, 255]; // red/black plaid
  }
  if (y >= 48 && x < 16) {
    if (x >= 6 && x <= 9) return [170, 175, 185, 255]; // steel axe blade
    return [110, 70, 40, 255]; // wood handle
  }
  if (y >= 44) return [55, 40, 30, 255];
  return [75, 60, 45, 255];
});

// 11. Blacksmith (64x64)
savePng("resource_pack/textures/entity/blacksmith.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if ((x * y) % 7 === 0) return [60, 60, 65, 255]; // soot smudges
    return [220, 175, 140, 255];
  }
  if (y >= 48) {
    if (x >= 24 && x <= 35) {
      if ((x === 25 || x === 26 || x === 33 || x === 34) && (y === 50 || y === 51)) return [100, 200, 240, 255]; // goggles
      return [180, 140, 40, 255];
    }
    return [40, 30, 25, 255];
  }
  if (y >= 16 && y < 32) {
    if (x >= 19 && x <= 28) return [95, 55, 30, 255]; // thick leather apron
    return [160, 155, 150, 255];
  }
  return [50, 40, 35, 255];
});

// 12. Merchant (64x64)
savePng("resource_pack/textures/entity/merchant.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && (x === 10 || x === 13)) return [60, 120, 70, 255];
    if (y === 13 && x >= 10 && x <= 13) return [140, 80, 50, 255];
    return [230, 190, 160, 255];
  }
  if (y >= 32 && y < 48) {
    if (x >= 40 && x <= 46) return [240, 220, 60, 255]; // golden feather
    return [130, 30, 60, 255]; // burgundy hat
  }
  if (y >= 48) {
    if (x >= 28 && x <= 37) return [180, 170, 140, 255]; // rolled blanket
    return [110, 75, 45, 255]; // leather pack
  }
  if (y >= 16 && y < 32) {
    if (x === 23 || x === 24 || y === 20 || y === 26) return [235, 195, 30, 255]; // gold trim
    return [30, 85, 150, 255]; // royal azure coat
  }
  return [140, 95, 50, 255];
});

// 13. Farmer (64x64)
savePng("resource_pack/textures/entity/farmer.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && (x === 10 || x === 13)) return [70, 100, 50, 255];
    return [220, 180, 145, 255];
  }
  if (y >= 32 && y < 48) {
    if ((x + y) % 3 === 0) return [235, 205, 110, 255];
    return [215, 185, 90, 255]; // straw hat
  }
  if (y >= 16 && y < 32) {
    if (x >= 20 && x <= 27) return [60, 90, 130, 255]; // bib
    return [230, 225, 215, 255];
  }
  return [55, 75, 115, 255];
});

// 14. Lamplighter (64x64)
savePng("resource_pack/textures/entity/lamplighter.png", 64, 64, (x, y) => {
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && (x === 10 || x === 13)) return [100, 170, 220, 255];
    return [210, 170, 140, 255];
  }
  if (y >= 48) {
    if (x >= 20 && x <= 24 && y >= 49 && y <= 54) {
      if (x >= 21 && x <= 23 && y >= 50 && y <= 53) return [255, 200, 60, 255]; // lamp flame
      return [160, 120, 40, 255];
    }
    return [30, 35, 45, 255];
  }
  if (y >= 16 && y < 32) {
    if (x >= 22 && x <= 25) return [190, 150, 40, 255]; // watchman badge
    return [25, 30, 45, 255]; // midnight cowl
  }
  return [20, 25, 35, 255];
});

// 15. Cartographer (64x64)
savePng("resource_pack/textures/entity/cartographer.png", 64, 64, (x, y) => {
  // Face with magnifying monocle (right eye: x=13, y=11)
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (x >= 12 && x <= 14 && y >= 10 && y <= 12) {
      if (x === 13 && y === 11) return [130, 215, 255, 255]; // lens
      return [220, 180, 50, 255]; // brass rim
    }
    if (y === 11 && x === 10) return [60, 110, 60, 255];
    return [225, 185, 150, 255];
  }
  // Scroll cylinder on hip & map (0..63, 48..63)
  if (y >= 48) {
    if (x < 16) return [120, 75, 40, 255]; // leather scroll case
    return [235, 220, 180, 255]; // parchment rolls
  }
  // Scholar robes (16..39, 16..31) - deep plum / ink-stained
  if (y >= 16 && y < 32) {
    if (x === 23 || x === 24 || y === 24) return [235, 195, 40, 255]; // compass & gold trim
    if ((x + y) % 8 === 0) return [20, 20, 30, 255]; // ink stain
    return [70, 35, 85, 255]; // royal scholar plum
  }
  return [50, 30, 60, 255];
});

// 16. Colonist (64x64)
savePng("resource_pack/textures/entity/colonist.png", 64, 64, (x, y) => {
  // Face
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if (y === 11 && (x === 10 || x === 13)) return [70, 120, 180, 255];
    return [220, 175, 140, 255]; // weathered pioneer
  }
  // Pioneer Hat & Pack (0..63, 32..47)
  if (y >= 32 && y < 48) {
    return [85, 60, 40, 255]; // weathered leather hat
  }
  // Bedroll & Supplies (0..63, 48..63)
  if (y >= 48) {
    if (x >= 24 && x <= 36) return [160, 150, 130, 255]; // rolled wool blanket
    return [100, 70, 45, 255];
  }
  // Pioneer Tunic (16..39, 16..31)
  if (y >= 16 && y < 32) {
    if (x === 21 || x === 26) return [45, 30, 20, 255]; // heavy pack straps
    return [115, 85, 55, 255]; // durable buckskin
  }
  return [65, 50, 35, 255];
});

// 17. Siege Ram (128x128)
savePng("resource_pack/textures/entity/siege_ram.png", 128, 128, (x, y) => {
  // Ram log (y: 90..127)
  if (y >= 90) {
    if (x >= 64 && x <= 74) return [180, 110, 45, 255]; // bronze ram head
    if ((x + y) % 6 === 0) return [70, 75, 80, 255]; // iron reinforcement band
    return [110, 70, 35, 255]; // carved timber log
  }
  // Heavy wooden wheels (x: 88..100)
  if (x >= 88 && y < 40) {
    if ((x + y) % 4 === 0) return [60, 65, 70, 255]; // iron rim
    return [95, 60, 30, 255];
  }
  // Covered chassis (roof and frame)
  if ((x + y) % 8 === 0) return [130, 85, 45, 255];
  return [100, 65, 35, 255]; // dark oak planks
});

// 18. Boundary Stone Block (64x64)
savePng("resource_pack/textures/blocks/boundary_stone.png", 64, 64, (x, y) => {
  // Carved heraldic crest (center: 32..47, 24..35)
  if (x >= 32 && x <= 47 && y >= 24 && y <= 35) {
    if (x === 39 || x === 40 || y === 29) return [235, 195, 30, 255]; // gold heraldic cross
    return [180, 35, 35, 255]; // red crest shield
  }
  // Weathered chiseled stone
  if ((x * y) % 11 === 0) return [120, 125, 130, 255]; // stone texture noise
  if ((x + y) % 7 === 0) return [165, 170, 175, 255];
  return [140, 145, 150, 255]; // stone brick grey
});

// 19. Realm Map Item (16x16)
savePng("resource_pack/textures/items/realm_map.png", 16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Ribbon in center
  if (x >= 7 && x <= 8 && y >= 3 && y <= 12) return [200, 30, 40, 255]; // red ribbon
  if (x === 6 && y === 8) return [240, 200, 35, 255]; // gold seal
  // Parchment roll
  if (x >= 2 && x <= 13 && y >= 4 && y <= 11) {
    if (y === 4 || y === 11) return [200, 180, 140, 255]; // edge shadow
    return [245, 230, 190, 255]; // aged parchment
  }
  return [0, 0, 0, 0];
});

// 20. War Horn Item (16x16)
savePng("resource_pack/textures/items/war_horn.png", 16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Horn curve
  const curve = Math.floor(Math.sin((x - 2) / 3.5) * 4) + 8;
  if (Math.abs(y - curve) <= 2 && x >= 2 && x <= 13) {
    if (x <= 4) return [235, 195, 40, 255]; // gold mouthpiece
    if (x >= 11) return [240, 200, 45, 255]; // flared horn bell
    if ((x + y) % 3 === 0) return [220, 220, 230, 255]; // silver inlay
    return [190, 150, 110, 255]; // polished animal horn
  }
  return [0, 0, 0, 0];
});

// 21. Commander's Banner Item (16x16)
savePng("resource_pack/textures/items/commander_banner.png", 16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Gold spear tip at top (x: 2..4, y: 1..2)
  if (x >= 2 && x <= 4 && y <= 2) return [245, 205, 45, 255];
  // Staff pole along left (x: 3, y: 1..14)
  if (x === 3 && y >= 1 && y <= 14) return [120, 75, 35, 255];
  // Gold crossbar at top of banner (x: 4..13, y: 3)
  if (x >= 4 && x <= 13 && y === 3) return [235, 195, 40, 255];
  // Flowing banner cloth (x: 4..13, y: 4..12)
  if (x >= 4 && x <= 13 && y >= 4 && y <= 12) {
    // Golden heraldic crown in center of cloth
    if (x >= 7 && x <= 9 && (y === 6 || y === 7)) return [240, 200, 45, 255];
    if (x === 8 && y === 5) return [245, 210, 50, 255];
    // Gold trim border
    if (x === 13 || y === 12) return [230, 190, 35, 255];
    // Crimson velvet banner cloth with silk shading
    if ((x + y) % 2 === 0) return [195, 25, 40, 255];
    return [165, 20, 35, 255];
  }
  return [0, 0, 0, 0];
});

// 22. Defensive Ballista (64x64)
savePng("resource_pack/textures/entity/ballista.png", 64, 64, (x, y) => {
  // Heavy timber frame (0..31, 0..31)
  if (x < 32 && y < 32) {
    if ((x + y) % 4 === 0) return [60, 65, 70, 255]; // iron bolt / bracket
    return [115, 75, 40, 255]; // oak pedestal
  }
  // Steel bow arms & string (32..63, 0..31)
  if (x >= 32 && y < 32) {
    if (y >= 14 && y <= 17) return [190, 195, 205, 255]; // steel cable
    return [80, 85, 95, 255]; // forged spring steel
  }
  // Giant heavy iron ballista bolt (32..63, 32..63)
  if (x >= 32 && y >= 32) {
    if (x >= 56) return [220, 45, 45, 255]; // red fletching feathers
    if (x <= 38) return [175, 180, 190, 255]; // barbed iron arrowhead
    return [110, 75, 45, 255]; // ash wood shaft
  }
  return [95, 60, 30, 255];
});

// 22. Siege Catapult (128x128)
savePng("resource_pack/textures/entity/catapult.png", 128, 128, (x, y) => {
  // Throwing arm (0..63, 72..110)
  if (x < 64 && y >= 72 && y < 112) {
    if (x < 15) return [180, 120, 50, 255]; // bronze bucket
    if ((x + y) % 8 === 0) return [60, 65, 70, 255]; // iron reinforcement
    return [105, 68, 32, 255]; // massive oak arm
  }
  // Counterweight bucket (52..80, 72..90)
  if (x >= 52 && x <= 80 && y >= 72 && y <= 90) {
    if ((x * y) % 7 === 0) return [140, 145, 150, 255]; // ballast stone
    return [85, 55, 30, 255];
  }
  // Heavy timber wheels with iron rims (72..105, 44..70)
  if (x >= 72 && x <= 105 && y >= 44 && y <= 70) {
    if ((x + y) % 5 === 0) return [50, 55, 60, 255]; // iron rim
    return [115, 75, 40, 255];
  }
  // Timber A-frame chassis
  if ((x + y) % 8 === 0) return [130, 85, 45, 255];
  return [95, 60, 30, 255];
});

// 23. Royal Retinue Knight (64x64)
savePng("resource_pack/textures/entity/royal_knight.png", 64, 64, (x, y) => {
  // Greathelm face with golden cross visor (8..15, 8..15)
  if (x >= 8 && x < 16 && y >= 8 && y < 16) {
    if ((x === 11 || x === 12) || (y === 11 && x >= 9 && x <= 14)) return [240, 200, 45, 255]; // golden cross visor
    if (y === 11 && (x === 10 || x === 13)) return [20, 25, 35, 255]; // visor eye slit
    return [180, 185, 195, 255]; // polished plate steel
  }
  // Gold plume crest on helm (16..31, 48..63)
  if (x >= 16 && x < 32 && y >= 48) {
    return [235, 195, 40, 255]; // golden knightly plume
  }
  // Royal blue cape with gold ermine border (0..15, 48..63)
  if (x < 16 && y >= 48) {
    if (y >= 60 && (x % 3 === 0)) return [240, 240, 245, 255]; // ermine white
    return [25, 65, 150, 255]; // royal blue velvet cape
  }
  // Heraldic Shield on Left Arm (40..63, 40..63)
  if (x >= 40 && y >= 40) {
    if (x >= 46 && x <= 56 && y >= 46 && y <= 56) return [240, 195, 35, 255]; // golden rampant lion
    return [175, 25, 40, 255]; // crimson heraldic shield
  }
  // Heavy Gothic Plate armor (chest and limbs)
  if ((x + y) % 6 === 0) return [215, 220, 230, 255]; // steel specular highlight
  if (x === 23 || x === 24) return [235, 195, 35, 255]; // gold inlay
  return [150, 155, 165, 255]; // gothic steel plate
});

// 24. Throne 2D Inventory Icon (16x16)
savePng("resource_pack/textures/items/throne_icon.png", 16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Gold crown crest on backrest
  if (y <= 3 && x >= 4 && x <= 11) {
    if ((x === 4 || x === 7 || x === 8 || x === 11) && y === 1) return [255, 235, 120, 255];
    if (y === 2 && (x === 7 || x === 8)) return [220, 40, 40, 255]; // ruby
    return [245, 195, 35, 255];
  }
  // Backrest royal red velvet with gold border
  if (y >= 4 && y <= 8 && x >= 3 && x <= 12) {
    if (x === 3 || x === 12 || y === 4) return [240, 190, 30, 255]; // gold trim
    if (x >= 5 && x <= 10) return [175, 25, 45, 255]; // velvet
    return [230, 180, 25, 255];
  }
  // Armrests
  if (y === 9 && (x === 2 || x === 3 || x === 12 || x === 13)) return [240, 190, 30, 255];
  // Seat cushion
  if (y === 10 && x >= 3 && x <= 12) return [185, 25, 45, 255];
  // Stone / gold base and legs
  if (y >= 11 && y <= 14) {
    if (x === 2 || x === 3 || x === 12 || x === 13) return [130, 135, 145, 255]; // legs
    if (y === 11) return [230, 180, 25, 255]; // seat base
    if (y === 14 && x >= 4 && x <= 11) return [160, 165, 175, 255]; // dais footrest
  }
  return [0, 0, 0, 0];
});

// 25. Boundary Stone 2D Inventory Icon (16x16)
savePng("resource_pack/textures/items/boundary_stone_icon.png", 16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return [0, 0, 0, 0];
  // Chiseled stone pillar shape (x: 4..11, y: 1..14)
  if (x >= 4 && x <= 11 && y >= 1 && y <= 14) {
    // Obelisk pointed cap
    if (y === 1 && (x === 7 || x === 8)) return [180, 185, 195, 255];
    if (y === 2 && x >= 6 && x <= 9) return [160, 165, 175, 255];
    // Heraldic crest shield in center of stone (y: 5..9, x: 5..10)
    if (y >= 5 && y <= 9 && x >= 5 && x <= 10) {
      if (x === 7 || x === 8 || y === 7) return [245, 205, 40, 255]; // gold cross
      return [180, 30, 40, 255]; // crimson shield
    }
    // Chiseled stone brick texture
    if ((x + y) % 3 === 0) return [130, 135, 140, 255];
    return [155, 160, 165, 255];
  }
  // Base pedestal
  if (y >= 13 && y <= 14 && x >= 2 && x <= 13) {
    return [120, 125, 130, 255];
  }
  return [0, 0, 0, 0];
});
