// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pk = process.env.PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const hasClerkKeys =
  (pk.startsWith('pk_test_') || pk.startsWith('pk_live_')) &&
  pk.length > 20 &&
  !!process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY.length > 20;

/** @type {import('astro').AstroIntegration[]} */
const integrations = [
  react(),
  tailwind({ applyBaseStyles: false }),
];

if (hasClerkKeys) {
  const clerk = (await import('@clerk/astro')).default;
  integrations.unshift(clerk());
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations,
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
