// Production shim: resolves `import Phaser from 'phaser'` to the CDN-loaded global `window.Phaser`.
const Phaser = (window as unknown as { Phaser: unknown }).Phaser;
export default Phaser;
