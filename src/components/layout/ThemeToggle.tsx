import { useEffect, useState } from 'react';
import { Sun, Moon, SunDim, MoonStar } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'soft' | 'twilight';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved === 'dark' || saved === 'light' || saved === 'soft' || saved === 'twilight') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'soft', 'twilight');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'soft') {
      root.classList.add('soft');
    } else if (theme === 'twilight') {
      root.classList.add('twilight');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      if (current === 'light') return 'soft';
      if (current === 'soft') return 'twilight';
      if (current === 'twilight') return 'dark';
      return 'light';
    });
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    if (theme === 'soft') return <SunDim className="h-5 w-5 text-amber-500" />;
    if (theme === 'twilight') return <MoonStar className="h-5 w-5 text-orange-400" />;
    return <Moon className="h-5 w-5" />;
  };

  const getTitle = () => {
    if (theme === 'light') return 'Switch to soft theme (Eye care)';
    if (theme === 'soft') return 'Switch to twilight theme (Night mode)';
    if (theme === 'twilight') return 'Switch to dark theme';
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
