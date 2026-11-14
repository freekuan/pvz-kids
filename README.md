# PvZ Kids - Tower Defense Game

A kid-friendly Plants vs. Zombies style lane-based tower defense game built with Phaser 3, TypeScript, and Vite. Designed for primary school children (Grade 3) with simple controls, bright colors, and educational English labels.

## Features

- **5 Progressive Levels**: Gradually increasing difficulty with wave-based zombie spawns
- **5-Lane Grid Gameplay**: Classic tower defense on a 5x9 lawn grid
- **Sun Resource System**: Collect falling sun from the sky and produce it with sunflowers
- **4 Plant Types**:
  - 🌻 **Sunflower** (Sun): Produces sun every 12 seconds
  - 🌱 **Peashooter** (Pea): Shoots peas at zombies in its lane
  - 🥜 **Wall-nut** (Nut): High HP blocker to protect other plants
  - 🍒 **Cherry Bomb** (Cherry): Explodes in a 3x3 area for massive damage
- **3 Zombie Types**: Normal, Conehead (more HP), Buckethead (much more HP)
- **Lawn Mowers**: Last-line-of-defense per lane
- **Touch & Mouse Support**: Works on desktop, tablets, and iPads
- **Responsive Scaling**: Fits any screen size
- **Progress Saving**: Level progress saved in localStorage
- **Kid-Friendly Design**: Large buttons, bright colors, simple English labels

## How to Run

### Development

```bash
npm install
npm run dev
```

The game will start at `http://localhost:5678`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy as a static site.

### Preview Production Build

```bash
npm run build
npm run preview
```

## How to Play

1. **Collect Sun**: Click/tap falling sun and sun produced by sunflowers
2. **Plant Defenses**: 
   - Click a plant card at the top
   - Click an empty grid tile to plant it (costs sun)
   - Plants have cooldowns after use
3. **Defend Your House**: Stop zombies from reaching the left side
4. **Remove Plants**: Use the shovel tool to remove unwanted plants
5. **Lawn Mowers**: Each lane has a mower as a last defense - once it's used, that lane is vulnerable!
6. **Win**: Survive all waves to unlock the next level

### Plant Strategy Tips for Kids

- Plant **Sunflowers** first to collect more sun
- Use **Peashooters** to attack zombies
- Place **Wall-nuts** in front to protect your shooters
- Save **Cherry Bombs** for groups of tough zombies

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

Or use the Vercel web interface:
1. Push this repo to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect Vite and deploy

The game works as a static site on any hosting platform (Netlify, GitHub Pages, etc.)

## Replacing Art Assets

The game currently uses simple programmatic shapes (circles, rectangles) as placeholders. To replace with real sprites:

### Asset Organization

Create sprite images and place them in `public/assets/`:

```
public/
  assets/
    plants/
      sunflower.png
      peashooter.png
      wallnut.png
      cherrybomb.png
    zombies/
      normal.png
      conehead.png
      buckethead.png
    projectiles/
      pea.png
    ui/
      sun.png
```

### Code Changes

1. **Load sprites** in scene preload:

```typescript
preload() {
  this.load.image('sunflower', 'assets/plants/sunflower.png');
  this.load.image('peashooter', 'assets/plants/peashooter.png');
  // ... load other assets
}
```

2. **Replace graphics** in entity classes:

In `src/entities/Plant.ts`, replace the `drawPlant()` method to use sprites:

```typescript
private drawPlant(): void {
  const sprite = this.scene.add.sprite(0, 0, this.plantType);
  this.add(sprite);
}
```

Similar changes for `Zombie.ts`, `Projectile.ts`, `Sun.ts`, etc.

### Recommended Sprite Sizes

- **Plants**: 80x80px
- **Zombies**: 80x120px
- **Projectiles**: 30x30px
- **Sun**: 60x60px
- **UI Icons**: 40x40px

All sprites should have transparent backgrounds (PNG format).

## Project Structure

```
src/
  config/
    constants.ts    # Game balance constants
    levels.ts       # Level wave configurations
  entities/
    Plant.ts        # Plant base class
    Zombie.ts       # Zombie base class
    Projectile.ts   # Pea projectile
    Sun.ts          # Collectible sun
    LawnMower.ts    # Last-defense mower
  scenes/
    TitleScene.ts        # Title screen
    LevelSelectScene.ts  # Level selection
    GameScene.ts         # Main gameplay
  main.ts           # Phaser game config & entry point
```

## Customization

### Difficulty Tuning

Edit `src/config/constants.ts` to adjust:
- Plant costs and cooldowns
- Zombie HP and speed
- Sun production rates
- Damage values

### Adding New Levels

Edit `src/config/levels.ts` to add more levels:

```typescript
{
  level: 6,
  name: 'Level 6',
  availablePlants: ['sunflower', 'peashooter', 'wallnut', 'cherrybomb'],
  waves: [
    [
      { zombieType: 'normal', lane: 0, delay: 0 },
      // ... more zombies
    ],
    // ... more waves
  ],
}
```

### Adding New Plants/Zombies

1. Add type data in `src/config/constants.ts`
2. Add drawing logic in entity class
3. Add behavior logic in `GameScene.ts`
4. Add to level configurations

## Technical Details

- **Engine**: Phaser 3.90.0
- **Language**: TypeScript 7.0
- **Build Tool**: Vite 8.3
- **Storage**: localStorage for progress
- **No Backend**: Pure client-side game
- **Browser Support**: Modern browsers, iOS Safari, Chrome, Firefox

## License

MIT - Free for personal and educational use.

## Credits

Inspired by Plants vs. Zombies by PopCap Games.
Built as an educational project for young learners.
