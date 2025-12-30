import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ThemeMode } from '@repo/types';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        setTheme: (theme) => {
          set({ theme });

          // Apply theme to document
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');

          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        },
      }),
      {
        name: 'theme-storage',
      }
    ),
    {
      name: 'theme-store',
    }
  )
);
