import { useContext } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeContext } from '@/contexts/theme';
import { Button } from '@/components/ui/button';
export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={context.toggle}
      aria-label={`Switch to ${context.theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${context.theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {context.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
