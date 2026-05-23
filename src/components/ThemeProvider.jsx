import { useEffect, useState } from 'react';
import { THEMES } from '../data/data';
import { ThemeContext } from '../hooks/useTheme';

const STORAGE_KEY = 'gsd-theme';
const DEFAULT_THEME = 'blue';

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_THEME;
        const saved = window.localStorage.getItem(STORAGE_KEY);
        return saved && THEMES[saved] ? saved : DEFAULT_THEME;
    });

    useEffect(() => {
        const palette = THEMES[theme] || THEMES[DEFAULT_THEME];
        const root = document.documentElement;
        root.style.setProperty('--primary', palette.primary);
        root.style.setProperty('--primary-dark', palette.primaryDark);
        root.style.setProperty('--primary-soft', palette.primarySoft);
        root.style.setProperty('--primary-line', palette.primaryLine);
        root.style.setProperty('--primary-ink', palette.primaryInk);
        root.dataset.theme = theme;
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
