import type { Config } from 'tailwindcss';
import sharedConfig from '@repo/config-tailwind';

const config: Config = {
  ...sharedConfig,
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
