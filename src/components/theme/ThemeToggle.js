'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Force apply theme to HTML element when theme changes
  useEffect(() => {
    if (mounted && theme) {
      const html = document.documentElement;
      // Remove existing theme classes
      html.classList.remove('light', 'dark');
      // Add the current theme class
      html.classList.add(theme);
      console.log('Theme applied to HTML:', theme, 'Classes:', html.className);
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const toggleTheme = () => {
    if (currentTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded transition-colors"
      style={{ 
        backgroundColor: 'transparent',
        color: currentTheme === 'dark' ? '#60a5fa' : '#d97706'
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      aria-label="Toggle theme"
      title={`Current theme: ${currentTheme}`}
    >
      {currentTheme === 'dark' ? (
        <Moon className="h-3 w-3" strokeWidth={1.5} />
      ) : (
        <Sun className="h-3 w-3" strokeWidth={1.5} />
      )}
    </button>
  );
}


