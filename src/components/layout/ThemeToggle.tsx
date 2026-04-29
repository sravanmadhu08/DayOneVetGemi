import { useEffect, useState } from 'react';
import { Sun, Moon, SunDim } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'soft';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved === 'dark' || saved === 'light' || saved === 'soft') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'soft');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'soft') {
      root.classList.add('soft');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      if (current === 'light') return 'soft';
      if (current === 'soft') return 'dark';
      return 'light';
    });
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    if (theme === 'soft') return <SunDim className="h-5 w-5 text-amber-500" />;
    return <Moon className="h-5 w-5" />;
  };

  const getTitle = () => {
    if (theme === 'light') return 'Switch to soft theme (Eye care)';
    if (theme === 'soft') return 'Switch to dark theme';
    return 'Switch to light theme';
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={getTitle()}
      id="theme-toggle"
      className="relative"
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
