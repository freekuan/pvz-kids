// Grid configuration
export const GRID_COLS = 9;
export const GRID_ROWS = 5;
export const GRID_START_X = 335;
export const GRID_START_Y = 200;
export const HOUSE_CENTER_X = 168;
export const TILE_WIDTH = 100;
export const TILE_HEIGHT = 100;

/** Official HUD slices — layout matched to preview-hud reference (source pixels at 1224×202 bar). */
export const HUD_BAR_SCALE = 0.4;
export const HUD_BAR_SRC_WIDTH = 1224;
export const HUD_BAR_SRC_HEIGHT = 202;
/** Right of the mower column (`GRID_START_X - 80` + mower art). */
export const HUD_BAR_LEFT_X = GRID_START_X - 80 + 74;
export const HUD_CLEARANCE_ABOVE_LAWN = 10;
export const HUD_TOP_MARGIN = 4;
/** Packet display height as a multiple of the scaled bar height (preview proportions). */
export const HUD_PACKET_BAR_RATIO = 1.1;
export const HUD_SHOVEL_BAR_RATIO = 1.05;
export const HUD_SUN_COUNTER_SRC_WIDTH = 311;
export const HUD_SUN_COUNTER_SRC_HEIGHT = 186;
export const HUD_PACKET_SRC_WIDTH = 240;
export const HUD_PACKET_SRC_HEIGHT = 272;
export const HUD_SHOVEL_SRC_WIDTH = 176;
export const HUD_SHOVEL_SRC_HEIGHT = 256;
/** Padding inside the wooden bar and gaps between HUD elements (screen px). */
export const HUD_BAR_PAD_X = 10;
export const HUD_ELEMENT_GAP = 8;
/** Slightly wider packets vs strict art aspect for long English names. */
export const HUD_PACKET_WIDTH_RATIO = 1.05;

// Game balance
export const INITIAL_SUN = 150;
export const SKY_SUN_AMOUNT = 25;
export const SKY_SUN_INTERVAL = 8000; // ms
export const SUNFLOWER_SUN_AMOUNT = 50;
export const SUNFLOWER_SUN_INTERVAL = 12000; // ms

// Plant data
export interface PlantData {
  type: string;
  name: string;
  sunCost: number;
  cooldown: number; // ms
  hp: number;
  description: string;
}

export const PLANT_TYPES: Record<string, PlantData> = {
  sunflower: {
    type: 'sunflower',
    name: 'Sun',
    sunCost: 50,
    cooldown: 5000,
    hp: 300,
    description: 'Produces sun',
  },
  peashooter: {
    type: 'peashooter',
    name: 'Pea',
    sunCost: 100,
    cooldown: 5000,
    hp: 300,
    description: 'Shoots peas',
  },
  wallnut: {
    type: 'wallnut',
    name: 'Nut',
    sunCost: 50,
    cooldown: 20000,
    hp: 4000,
    description: 'Blocks zombies',
  },
  cherrybomb: {
    type: 'cherrybomb',
    name: 'Cherry',
    sunCost: 150,
    cooldown: 30000,
    hp: 300,
    description: 'Explodes 3x3',
  },
};

// Zombie data
export interface ZombieData {
  type: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  attackSpeed: number; // ms between attacks
}

export const ZOMBIE_TYPES: Record<string, ZombieData> = {
  normal: {
    type: 'normal',
    name: 'Zombie',
    hp: 200,
    speed: 20,
    damage: 100,
    attackSpeed: 1500,
  },
  conehead: {
    type: 'conehead',
    name: 'Conehead',
    hp: 640,
    speed: 20,
    damage: 100,
    attackSpeed: 1500,
  },
  buckethead: {
    type: 'buckethead',
    name: 'Buckethead',
    hp: 1370,
    speed: 20,
    damage: 100,
    attackSpeed: 1500,
  },
};

// Projectile
export const PEA_DAMAGE = 20;
export const PEA_SPEED = 300;

// Cherry bomb
export const CHERRY_DAMAGE = 1800;
export const CHERRY_EXPLODE_DELAY = 1000;
export const CHERRY_RANGE = 1.5; // in tiles

// Lawn mower
export const MOWER_SPEED = 400;
export const MOWER_DAMAGE = 1800;
