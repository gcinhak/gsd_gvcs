import { createContext, useContext } from 'react';

export const ThemeContext = createContext({ theme: 'blue', setTheme: () => {} });

export function useTheme() {
    return useContext(ThemeContext);
}
