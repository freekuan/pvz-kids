// Grid configuration
export const GRID_COLS = 9;
export const GRID_ROWS = 5;
export const GRID_START_X = 335;
export const GRID_START_Y = 218;
export const HOUSE_CENTER_X = 168;
export const TILE_WIDTH = 100;
export const TILE_HEIGHT = 100;
/** Bottom-anchored sprite offset shared by plants, zombies, and mowers. */
export const ROW_SPRITE_FOOT_OFFSET = 12;
/** Target display height for planted sprites inside one ~100×100 lawn tile. */
export const PLANT_TILE_FIT = 86;

/** Official HUD slices — layout matched to preview-hud reference (source pixels at 1224×202 bar). */
export const HUD_BAR_SCALE = 0.4;
export const HUD_BAR_SRC_WIDTH = 1224;
export const HUD_BAR_SRC_HEIGHT = 202;
/** Right of the mower column (`GRID_START_X - 80` + mower art). */
export const HUD_BAR_LEFT_X = GRID_START_X - 80 + 74;
export const HUD_CLEARANCE_ABOVE_LAWN = 34;
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
/** Extra hit slop on seed packets and shovel for tablet taps (pixels per side). */
export const HUD_PACKET_HIT_PAD_X = 18;
export const HUD_PACKET_HIT_PAD_Y = 22;
export const HUD_SHOVEL_HIT_PAD_X = 20;
export const HUD_SHOVEL_HIT_PAD_Y = 24;

// Game balance
export const INITIAL_SUN = 150;
export const SKY_SUN_AMOUNT = 25;
export const SKY_SUN_INTERVAL = 7000; // ms
export const SUNFLOWER_SUN_AMOUNT = 50;
export const SUNFLOWER_SUN_INTERVAL = 12000; // ms
export const PEA_SHOOT_INTERVAL = 1400; // ms

// Wave pacing
export const WAVE_ADVANCE_HP_RATIO = 0.35; // advance when wave remaining HP <= 35%
export const WAVE_MAX_WAIT_MS = 32000; // fallback max time before advancing wave

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
    cooldown: 15000,
    hp: 4000,
    description: 'Blocks zombies',
  },
  cherrybomb: {
    type: 'cherrybomb',
    name: 'Cherry',
    sunCost: 150,
    cooldown: 25000,
    hp: 300,
    description: 'Explodes 3x3',
  },
  snowpea: {
    type: 'snowpea',
    name: 'Snow Pea',
    sunCost: 175,
    cooldown: 7500,
    hp: 300,
    description: 'Slows zombies',
  },
  repeater: {
    type: 'repeater',
    name: 'Repeater',
    sunCost: 200,
    cooldown: 7500,
    hp: 300,
    description: 'Shoots 2 peas',
  },
  potatomine: {
    type: 'potatomine',
    name: 'Mine',
    sunCost: 25,
    cooldown: 20000,
    hp: 300,
    description: 'Explodes on contact',
  },
  plantern: {
    type: 'plantern',
    name: 'Plantern',
    sunCost: 25,
    cooldown: 15000,
    hp: 300,
    description: 'Boosts 3x3 plants',
  },
  snowflake: {
    type: 'snowflake',
    name: 'Snowflake',
    sunCost: 125,
    cooldown: 30000,
    hp: 300,
    description: 'Blizzard AoE',
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
    hp: 560,
    speed: 20,
    damage: 100,
    attackSpeed: 1500,
  },
  buckethead: {
    type: 'buckethead',
    name: 'Buckethead',
    hp: 1100,
    speed: 20,
    damage: 100,
    attackSpeed: 1500,
  },
};

// Projectile
export const PEA_DAMAGE = 20;
export const PEA_SPEED = 300;
/** Pea sprite display size. */
export const PEA_DISPLAY_SIZE = 22;
/** Mouth position on peashooter.png (206×200), measured from sprite center X / top Y. */
export const PEASHOOTER_MOUTH_X_OF_WIDTH = 0.465;
export const PEASHOOTER_MOUTH_Y_OF_HEIGHT_FROM_TOP = 0.305;
export const SUN_COLLECT_HIT_RADIUS = 48;
export const SUN_DEPTH = 50;

// Cherry bomb
export const CHERRY_DAMAGE = 1800;
export const CHERRY_EXPLODE_DELAY = 1000;
export const CHERRY_RANGE = 1.5; // in tiles

// Snow pea, Potato mine & Plantern
export const SNOW_PEA_SLOW_FACTOR = 0.5;
export const SNOW_PEA_SLOW_DURATION = 4000; // ms
export const POTATO_ARM_TIME = 4000; // ms
export const POTATO_DAMAGE = 1800;
export const PLANTERN_BUFF_RANGE = 1; // 3x3 grid radius
export const PLANTERN_SPEED_BOOST = 1.35; // +35% attack & sun speed in 3x3 aura
export const SNOWFLAKE_DURATION = 5000; // ms
export const SNOWFLAKE_TICK_INTERVAL = 500; // ms
export const SNOWFLAKE_TICK_DAMAGE = 15;
export const GAME_SPEED_OPTIONS = [1, 1.25, 1.5, 2] as const;

// Lawn mower
export const MOWER_SPEED = 400;
export const MOWER_DAMAGE = 1800;
