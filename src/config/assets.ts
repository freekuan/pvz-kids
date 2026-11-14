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
    wallnut: { key: 'wallnut', url: 'assets/plants/wallnut.png' },
    cherrybomb: { key: 'cherrybomb', url: 'assets/plants/cherrybomb.png' },
  },
  zombies: {
    normal: { key: 'zombie_normal', url: 'assets/zombies/normal.png' },
    conehead: { key: 'zombie_conehead', url: 'assets/zombies/conehead.png' },
    buckethead: { key: 'zombie_buckethead', url: 'assets/zombies/buckethead.png' },
  },
  packets: {
    sunflower: { key: 'packet_sunflower', url: 'assets/ui/packet_sunflower.png' },
    peashooter: { key: 'packet_peashooter', url: 'assets/ui/packet_peashooter.png' },
    wallnut: { key: 'packet_wallnut', url: 'assets/ui/packet_wallnut.png' },
    cherrybomb: { key: 'packet_cherrybomb', url: 'assets/ui/packet_cherrybomb.png' },
  },
} as const;

export const PLANT_TEXTURE_KEYS: Record<string, string> = {
  sunflower: ASSET_MANIFEST.plants.sunflower.key,
  peashooter: ASSET_MANIFEST.plants.peashooter.key,
  wallnut: ASSET_MANIFEST.plants.wallnut.key,
  cherrybomb: ASSET_MANIFEST.plants.cherrybomb.key,
};

export const ZOMBIE_TEXTURE_KEYS: Record<string, string> = {
  normal: ASSET_MANIFEST.zombies.normal.key,
  conehead: ASSET_MANIFEST.zombies.conehead.key,
  buckethead: ASSET_MANIFEST.zombies.buckethead.key,
};

export const PACKET_TEXTURE_KEYS: Record<string, string> = {
  sunflower: ASSET_MANIFEST.packets.sunflower.key,
  peashooter: ASSET_MANIFEST.packets.peashooter.key,
  wallnut: ASSET_MANIFEST.packets.wallnut.key,
  cherrybomb: ASSET_MANIFEST.packets.cherrybomb.key,
};

export function loadGameAssets(scene: Phaser.Scene): void {
  const m = ASSET_MANIFEST;
  scene.load.image(m.titleScreen.key, m.titleScreen.url);
  scene.load.image(m.houseSidewalk.key, m.houseSidewalk.url);
  scene.load.image(m.lawnLight.key, m.lawnLight.url);
  scene.load.image(m.lawnDark.key, m.lawnDark.url);
  scene.load.image(m.seedBar.key, m.seedBar.url);
  scene.load.image(m.sunCounter.key, m.sunCounter.url);
  scene.load.image(m.sun.key, m.sun.url);
  scene.load.image(m.pea.key, m.pea.url);
  scene.load.image(m.shovel.key, m.shovel.url);
  scene.load.image(m.lawnmower.key, m.lawnmower.url);

  Object.values(m.plants).forEach((a) => scene.load.image(a.key, a.url));
  Object.values(m.zombies).forEach((a) => scene.load.image(a.key, a.url));
  Object.values(m.packets).forEach((a) => scene.load.image(a.key, a.url));
}