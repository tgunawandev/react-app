import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/utils',
  'packages/hooks',
  'packages/ui',
  'apps/web',
  'apps/admin',
]);
