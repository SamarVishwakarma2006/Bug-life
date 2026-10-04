import { createContext } from 'react';
export const ThemeContext = createContext<{
  theme: 'dark' | 'light';
  toggle: () => void;
} | null>(null);
