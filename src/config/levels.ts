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
  /** Ms of prep before the first wave (levels 1–3 use clear-between-waves pacing). */
  prepTimeMs?: number;
  /** Ms rest after a wave is fully spawned and all its zombies are dead. */
  restTimeMs?: number;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Level 1',
    prepTimeMs: 30_000,
    restTimeMs: 10_000,
    availablePlants: ['sunflower', 'peashooter'],
    waves: [
      [{ zombieType: 'normal', lane: 2, delay: 0 }],
      [
        { zombieType: 'normal', lane: 1, delay: 0 },
        { zombieType: 'normal', lane: 3, delay: 8_000 },
      ],
      [
        { zombieType: 'normal', lane: 0, delay: 0 },
        { zombieType: 'normal', lane: 2, delay: 5_000 },
        { zombieType: 'normal', lane: 4, delay: 10_000 },
      ],
    ],
  },
  {
    level: 2,
    name: 'Level 2',
    prepTimeMs: 25_000,
    restTimeMs: 8_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut'],
    waves: [
      [{ zombieType: 'normal', lane: 2, delay: 0 }],
      [
        { zombieType: 'normal', lane: 1, delay: 0 },
        { zombieType: 'conehead', lane: 3, delay: 8_000 },
      ],
      [
        { zombieType: 'normal', lane: 0, delay: 0 },
        { zombieType: 'normal', lane: 2, delay: 6_000 },
        { zombieType: 'conehead', lane: 4, delay: 12_000 },
      ],
    ],
  },
  {
    level: 3,
    name: 'Level 3',
    prepTimeMs: 25_000,
    restTimeMs: 8_000,
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb'],
    waves: [
      [{ zombieType: 'normal', lane: 2, delay: 0 }],
      [
        { zombieType: 'normal', lane: 1, delay: 0 },
        { zombieType: 'conehead', lane: 3, delay: 8_000 },
      ],
      [
        { zombieType: 'conehead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 2, delay: 10_000 },
      ],
      [
        { zombieType: 'normal', lane: 1, delay: 0 },
        { zombieType: 'normal', lane: 3, delay: 6_000 },
        { zombieType: 'conehead', lane: 4, delay: 12_000 },
        { zombieType: 'buckethead', lane: 0, delay: 18_000 },
      ],
    ],
  },
  {
    level: 4,
    name: 'Level 4',
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb'],
    waves: [
      [
        { zombieType: 'conehead', lane: 1, delay: 0 },
        { zombieType: 'conehead', lane: 3, delay: 0 },
      ],
      [
        { zombieType: 'buckethead', lane: 0, delay: 0 },
        { zombieType: 'normal', lane: 2, delay: 500 },
        { zombieType: 'buckethead', lane: 4, delay: 1000 },
      ],
      [
        { zombieType: 'normal', lane: 0, delay: 0 },
        { zombieType: 'conehead', lane: 1, delay: 500 },
        { zombieType: 'buckethead', lane: 2, delay: 1000 },
        { zombieType: 'conehead', lane: 3, delay: 1500 },
        { zombieType: 'normal', lane: 4, delay: 2000 },
      ],
      [
        { zombieType: 'conehead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 1, delay: 500 },
        { zombieType: 'buckethead', lane: 2, delay: 1000 },
        { zombieType: 'buckethead', lane: 3, delay: 1500 },
        { zombieType: 'conehead', lane: 4, delay: 2000 },
      ],
      [
        { zombieType: 'buckethead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 1, delay: 500 },
        { zombieType: 'buckethead', lane: 2, delay: 1000 },
        { zombieType: 'buckethead', lane: 3, delay: 1500 },
        { zombieType: 'buckethead', lane: 4, delay: 2000 },
      ],
    ],
  },
  {
    level: 5,
    name: 'Level 5',
    availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb'],
    waves: [
      [
        { zombieType: 'conehead', lane: 0, delay: 0 },
        { zombieType: 'conehead', lane: 2, delay: 0 },
        { zombieType: 'conehead', lane: 4, delay: 0 },
      ],
      [
        { zombieType: 'buckethead', lane: 1, delay: 0 },
        { zombieType: 'conehead', lane: 2, delay: 500 },
        { zombieType: 'buckethead', lane: 3, delay: 1000 },
      ],
      [
        { zombieType: 'normal', lane: 0, delay: 0 },
        { zombieType: 'conehead', lane: 0, delay: 500 },
        { zombieType: 'buckethead', lane: 1, delay: 1000 },
        { zombieType: 'buckethead', lane: 2, delay: 1500 },
        { zombieType: 'buckethead', lane: 3, delay: 2000 },
        { zombieType: 'conehead', lane: 4, delay: 2500 },
        { zombieType: 'normal', lane: 4, delay: 3000 },
      ],
      [
        { zombieType: 'conehead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 1, delay: 500 },
        { zombieType: 'buckethead', lane: 2, delay: 1000 },
        { zombieType: 'buckethead', lane: 3, delay: 1500 },
        { zombieType: 'conehead', lane: 4, delay: 2000 },
        { zombieType: 'normal', lane: 2, delay: 2500 },
      ],
      [
        { zombieType: 'buckethead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 1, delay: 300 },
        { zombieType: 'buckethead', lane: 2, delay: 600 },
        { zombieType: 'buckethead', lane: 3, delay: 900 },
        { zombieType: 'buckethead', lane: 4, delay: 1200 },
        { zombieType: 'conehead', lane: 0, delay: 1500 },
        { zombieType: 'conehead', lane: 1, delay: 1800 },
        { zombieType: 'conehead', lane: 3, delay: 2100 },
        { zombieType: 'conehead', lane: 4, delay: 2400 },
      ],
      [
        { zombieType: 'buckethead', lane: 0, delay: 0 },
        { zombieType: 'buckethead', lane: 1, delay: 200 },
        { zombieType: 'buckethead', lane: 2, delay: 400 },
        { zombieType: 'buckethead', lane: 3, delay: 600 },
        { zombieType: 'buckethead', lane: 4, delay: 800 },
        { zombieType: 'buckethead', lane: 2, delay: 1000 },
      ],
    ],
  },
];