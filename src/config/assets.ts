/** Designer art paths (under `public/`) and Phaser texture keys. */
export const ASSET_MANIFEST = {
  titleScreen: { key: 'title_bg', url: 'assets/backgrounds/title_bg.jpg' },
  houseSidewalk: { key: 'house_sidewalk', url: 'assets/backgrounds/house_sidewalk.jpg' },
  lawnLight: { key: 'lawn_light', url: 'assets/backgrounds/lawn_light.jpg' },
  lawnDark: { key: 'lawn_dark', url: 'assets/backgrounds/lawn_dark.jpg' },
  seedBar: { key: 'seed_bar', url: 'assets/ui/seed_bar.png' },
  sunCounter: { key: 'sun_counter', url: 'assets/ui/sun_counter.png' },
  sun: { key: 'sun', url: 'assets/ui/sun.png' },
  pea: { key: 'pea', url: 'assets/ui/pea.png' },
  shovel: { key: 'shovel', url: 'assets/ui/shovel.png' },
  lawnmower: { key: 'lawnmower', url: 'assets/ui/lawnmower.png' },
  plants: {
    sunflower: { key: 'sunflower', url: 'assets/plants/sunflower.png' },
    peashooter: { key: 'peashooter', url: 'assets/plants/peashooter.png' },
    snowpea: { key: 'snowpea', url: 'assets/plants/snowpea.png' },
    repeater: { key: 'repeater', url: 'assets/plants/repeater.png' },
    wallnut: { key: 'wallnut', url: 'assets/plants/wallnut.png' },
    cherrybomb: { key: 'cherrybomb', url: 'assets/plants/cherrybomb.png' },
    potatomine: { key: 'potatomine', url: 'assets/plants/potatomine.png' },
    plantern: { key: 'plantern', url: 'assets/plants/plantern.png' },
  },
  zombies: {
    normal: { key: 'zombie_normal', url: 'assets/zombies/normal.png' },
    conehead: { key: 'zombie_conehead', url: 'assets/zombies/conehead.png' },
    buckethead: { key: 'zombie_buckethead', url: 'assets/zombies/buckethead.png' },
  },
  packets: {
    sunflower: { key: 'packet_sunflower', url: 'assets/ui/packet_sunflower.png' },
    peashooter: { key: 'packet_peashooter', url: 'assets/ui/packet_peashooter.png' },
    snowpea: { key: 'packet_snowpea', url: 'assets/ui/packet_snowpea.png' },
    repeater: { key: 'packet_repeater', url: 'assets/ui/packet_repeater.png' },
    wallnut: { key: 'packet_wallnut', url: 'assets/ui/packet_wallnut.png' },
    cherrybomb: { key: 'packet_cherrybomb', url: 'assets/ui/packet_cherrybomb.png' },
    potatomine: { key: 'packet_potatomine', url: 'assets/ui/packet_potatomine.png' },
    plantern: { key: 'packet_plantern', url: 'assets/ui/packet_plantern.png' },
    snowflake: { key: 'packet_snowflake', url: 'assets/ui/packet_snowflake.png' },
  },
} as const;

export const PLANT_TEXTURE_KEYS: Record<string, string> = {
  sunflower: ASSET_MANIFEST.plants.sunflower.key,
  peashooter: ASSET_MANIFEST.plants.peashooter.key,
  snowpea: ASSET_MANIFEST.plants.snowpea.key,
  repeater: ASSET_MANIFEST.plants.repeater.key,
  wallnut: ASSET_MANIFEST.plants.wallnut.key,
  cherrybomb: ASSET_MANIFEST.plants.cherrybomb.key,
  potatomine: ASSET_MANIFEST.plants.potatomine.key,
  plantern: ASSET_MANIFEST.plants.plantern.key,
};

export const ZOMBIE_TEXTURE_KEYS: Record<string, string> = {
  normal: ASSET_MANIFEST.zombies.normal.key,
  conehead: ASSET_MANIFEST.zombies.conehead.key,
  buckethead: ASSET_MANIFEST.zombies.buckethead.key,
};

export const PACKET_TEXTURE_KEYS: Record<string, string> = {
  sunflower: ASSET_MANIFEST.packets.sunflower.key,
  peashooter: ASSET_MANIFEST.packets.peashooter.key,
  snowpea: ASSET_MANIFEST.packets.snowpea.key,
  repeater: ASSET_MANIFEST.packets.repeater.key,
  wallnut: ASSET_MANIFEST.packets.wallnut.key,
  cherrybomb: ASSET_MANIFEST.packets.cherrybomb.key,
  potatomine: ASSET_MANIFEST.packets.potatomine.key,
  plantern: ASSET_MANIFEST.packets.plantern.key,
  snowflake: ASSET_MANIFEST.packets.snowflake.key,
};

function queueImageIfMissing(scene: Phaser.Scene, key: string, url: string): void {
  if (!scene.textures.exists(key)) {
    scene.load.image(key, url);
  }
}

/** Stage 1: minimal assets required to show TitleScene immediately. */
export function loadTitleAssets(scene: Phaser.Scene): void {
  const m = ASSET_MANIFEST;
  queueImageIfMissing(scene, m.titleScreen.key, m.titleScreen.url);
}

/** Stage 2: gameplay assets preloaded in the background during TitleScene (or on GameScene entry). */
export function loadGameplayAssets(scene: Phaser.Scene): void {
  const m = ASSET_MANIFEST;
  queueImageIfMissing(scene, m.houseSidewalk.key, m.houseSidewalk.url);
  queueImageIfMissing(scene, m.lawnLight.key, m.lawnLight.url);
  queueImageIfMissing(scene, m.lawnDark.key, m.lawnDark.url);
  queueImageIfMissing(scene, m.seedBar.key, m.seedBar.url);
  queueImageIfMissing(scene, m.sunCounter.key, m.sunCounter.url);
  queueImageIfMissing(scene, m.sun.key, m.sun.url);
  queueImageIfMissing(scene, m.pea.key, m.pea.url);
  queueImageIfMissing(scene, m.shovel.key, m.shovel.url);
  queueImageIfMissing(scene, m.lawnmower.key, m.lawnmower.url);

  Object.values(m.plants).forEach((a) => queueImageIfMissing(scene, a.key, a.url));
  Object.values(m.zombies).forEach((a) => queueImageIfMissing(scene, a.key, a.url));
  Object.values(m.packets).forEach((a) => queueImageIfMissing(scene, a.key, a.url));
}

export function loadGameAssets(scene: Phaser.Scene): void {
  loadTitleAssets(scene);
  loadGameplayAssets(scene);
}