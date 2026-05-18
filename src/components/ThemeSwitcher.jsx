import { THEMES } from '../data';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    return (
        <div className="theme-switcher" aria-label="테마 선택">
            {Object.entries(THEMES).map(([key, t]) => (
                <button
                    key={key}
                    className={`theme-swatch ${theme === key ? 'active' : ''}`}
                    style={{ background: t.primary }}
                    aria-label={`${t.name} 테마`}
                    title={`${t.name} 테마`}
                    onClick={() => setTheme(key)}
                />
            ))}
        </div>
    );
}
