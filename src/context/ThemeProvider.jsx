import { createContext, useContext, useState } from 'react';
import { getInitialTheme, useThemeEffect } from '../hooks/useRunnerEffects';
import PropTypes from 'prop-types';

const ThemeContext = createContext(null);

/**
 * React context provider that manages and exposes the global application theme.
 *
 * This provider:
 * - Initializes the theme using {@link getInitialTheme}.
 * - Applies and persists the theme via {@link useThemeEffect}.
 * - Exposes the current theme and helpers through {@link ThemeContext}.
 *
 * Must wrap any components that need access to theme state via {@link useTheme}.
 *
 * @component
 * @param {{ children: React.ReactNode }} props - Provider props.
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme());
    useThemeEffect(theme);

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired
};

/**
 * Custom React hook for accessing the global theme context.
 *
 * This hook provides access to the current theme state and theme helpers
 * exposed by {@link ThemeProvider}.
 *
 * Must be used within a {@link ThemeProvider}, otherwise it will throw.
 *
 * @returns {{
 *   theme: 'light' | 'dark',
 *   setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>,
 *   toggleTheme: () => void
 * }}
 *
 * @throws {Error} If used outside of a ThemeProvider.
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 * toggleTheme();
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const themeContext = useContext(ThemeContext);

    if (!themeContext) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }

    return themeContext;
};
