import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHASER_CDN = 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
const PHASER_FALLBACK_CDN = 'https://unpkg.com/phaser@3.90.0/dist/phaser.min.js';

function phaserCdnPlugin(): Plugin {
  return {
    name: 'phaser-cdn-inject',
    apply: 'build',
    transformIndexHtml(html) {
      const tags = [
        `<script src="${PHASER_CDN}"></script>`,
        `<script>if(!window.Phaser){document.write('<script src="${PHASER_FALLBACK_CDN}"><\\/script>');}</script>`,
      ].join('\n    ');
      return html.replace('</head>', `    ${tags}\n  </head>`);
    },
  };
}

export default defineConfig(({ command }) => ({
  resolve:
    command === 'build'
      ? {
          alias: {
            phaser: path.resolve(__dirname, 'src/phaser-global.ts'),
          },
        }
      : undefined,
  plugins: [phaserCdnPlugin()],
}));
