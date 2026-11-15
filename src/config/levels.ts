export interface Wave {
  zombieType: string;
  lane: number; // 0-4
  delay: number; // ms from wave start
}

export interface LevelConfig {
  level: number;
  name: string;
  waves: Wave[][];
  availablePlants: string[];
  /** Ms of prep before the first wave starts. */
  prepTimeMs: number;
  /** Ms rest after a wave's threshold is cleared before starting the next wave. */
  restTimeMs: number;
}

/**
 * Helper to stagger zombies in a wave with even spacing so they don't clump
 * on top of each other, while keeping lane variety.
 */
function buildWave(
  entries: Array<{ zombieType: string; lane: number; delay?: number }>,
  defaultIntervalMs: number
): Wave[] {
  return entries.map((entry, idx) => ({
    zombieType: entry.zombieType,
    lane: entry.lane,
    delay: entry.delay ?? idx * defaultIntervalMs,
  }));
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Level 1',
    prepTimeMs: 16_000,
    restTimeMs: 6_000,
    availablePlants: ['sunflower', 'peashooter'],
    waves: [
      buildWave([{ zombieType: 'normal', lane: 2 }], 0),
      buildWave(
        [
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'normal', lane: 3 },
        ],
        6_500
      ),
      buildWave(
        [
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'normal', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        4_500
      ),
    ],
  },
  {
    level: 2,
    name: 'Level 2',
    prepTimeMs: 18_000,
    restTimeMs: 6_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut'],
    waves: [
      buildWave(
        [
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'normal', lane: 1 },
        ],
        7_000
      ),
      buildWave(
        [
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'normal', lane: 2 },
        ],
        5_500
      ),
      buildWave(
        [
          { zombieType: 'normal', lane: 4 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'normal', lane: 3 },
          { zombieType: 'normal', lane: 0 },
        ],
        4_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 4 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'normal', lane: 1 },
        ],
        3_500
      ),
    ],
  },
  {
    level: 3,
    name: 'Level 3',
    prepTimeMs: 18_000,
    restTimeMs: 6_500,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb'],
    waves: [
      buildWave(
        [
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'normal', lane: 3 },
        ],
        6_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 4 },
        ],
        5_000
      ),
      buildWave(
        [
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'normal', lane: 4 },
        ],
        4_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'normal', lane: 4 },
        ],
        3_200
      ),
    ],
  },
  {
    level: 4,
    name: 'Level 4',
    prepTimeMs: 20_000,
    restTimeMs: 7_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea'],
    waves: [
      buildWave(
        [
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'conehead', lane: 3 },
        ],
        6_000
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'conehead', lane: 4 },
        ],
        4_500
      ),
      buildWave(
        [
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 4 },
        ],
        3_800
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'buckethead', lane: 3 },
        ],
        3_200
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'normal', lane: 2 },
        ],
        2_500
      ),
    ],
  },
  {
    level: 5,
    name: 'Level 5',
    prepTimeMs: 20_000,
    restTimeMs: 7_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea', 'repeater'],
    waves: [
      buildWave(
        [
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'normal', lane: 3 },
        ],
        5_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        4_000
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        3_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'normal', lane: 4 },
        ],
        3_200
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        2_800
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 3 },
          { zombieType: 'conehead', lane: 2 },
        ],
        2_000
      ),
    ],
  },
  {
    level: 6,
    name: 'Level 6',
    prepTimeMs: 20_000,
    restTimeMs: 6_500,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea', 'repeater', 'potatomine', 'plantern', 'snowflake'],
    waves: [
      buildWave(
        [
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'normal', lane: 3 },
          { zombieType: 'conehead', lane: 2 },
        ],
        4_500
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        3_600
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'normal', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
        ],
        3_000
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 2 },
        ],
        2_600
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
        ],
        2_200
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'normal', lane: 4 },
          { zombieType: 'normal', lane: 1 },
        ],
        1_800
      ),
    ],
  },
  {
    level: 7,
    name: 'Level 7',
    prepTimeMs: 20_000,
    restTimeMs: 6_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea', 'repeater', 'potatomine', 'plantern', 'snowflake'],
    waves: [
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'conehead', lane: 4 },
        ],
        4_000
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'normal', lane: 0 },
          { zombieType: 'normal', lane: 4 },
        ],
        3_200
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
        ],
        2_800
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 2 },
        ],
        2_500
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'normal', lane: 3 },
        ],
        2_200
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'normal', lane: 2 },
        ],
        1_900
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 2 },
        ],
        1_600
      ),
    ],
  },
  {
    level: 8,
    name: 'Level 8',
    prepTimeMs: 20_000,
    restTimeMs: 5_500,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea', 'repeater', 'potatomine', 'plantern', 'snowflake'],
    waves: [
      buildWave(
        [
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
        ],
        3_800
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'normal', lane: 2 },
        ],
        3_000
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'conehead', lane: 2 },
        ],
        2_500
      ),
      buildWave(
        [
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 3 },
        ],
        2_200
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'normal', lane: 2 },
        ],
        1_900
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'conehead', lane: 4 },
        ],
        1_700
      ),
      buildWave(
        [
          { zombieType: 'buckethead', lane: 0 },
          { zombieType: 'buckethead', lane: 1 },
          { zombieType: 'buckethead', lane: 2 },
          { zombieType: 'buckethead', lane: 3 },
          { zombieType: 'buckethead', lane: 4 },
          { zombieType: 'conehead', lane: 0 },
          { zombieType: 'conehead', lane: 1 },
          { zombieType: 'conehead', lane: 2 },
          { zombieType: 'conehead', lane: 3 },
          { zombieType: 'conehead', lane: 4 },
          { zombieType: 'buckethead', lane: 2 },
        ],
        1_400
      ),
    ],
  },
];
