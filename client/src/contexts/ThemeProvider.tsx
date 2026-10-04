import { useEffect, useState, type ReactNode } from 'react';
import { ThemeContext } from './theme';
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('buglife-theme') === 'light' ? 'light' : 'dark',
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('buglife-theme', theme);
  }, [theme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () =>
          setTheme((value) => (value === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
