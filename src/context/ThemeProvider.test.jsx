import { render, screen as rtlScreen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

// --| Test component consuming useTheme
const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div>
            <button onClick={toggleTheme}>🌓 {theme === 'dark' ? 'Light' : 'Dark'} Theme</button>
            <span data-testid="theme">{theme}</span>
        </div>
    );
};

describe('ThemeProvider', () => {
    it('Renders buttons and initial theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const themeButton = rtlScreen.getByText(/🌓/);
        const themeSpan = rtlScreen.getByTestId('theme');

        expect(themeSpan.textContent).toMatch(/dark|light/);
        expect(themeButton).toHaveTextContent(themeSpan.textContent === 'dark' ? 'Light' : 'Dark');
    });

    it('Toggles theme when theme button is clicked', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const themeButton = rtlScreen.getByText(/🌓/);
        const themeSpan = rtlScreen.getByTestId('theme');

        const initialTheme = themeSpan.textContent;

        fireEvent.click(themeButton);

        expect(themeSpan.textContent).not.toBe(initialTheme);
        expect(document.body.className).toBe(themeSpan.textContent);
        expect(themeButton.textContent).toMatch(themeSpan.textContent === 'dark' ? 'Light' : 'Dark');
    });

    it('Throws if useTheme used outside ThemeProvider', () => {
        // eslint-disable-next-line no-console
        const consoleError = console.error;
        // eslint-disable-next-line no-console
        console.error = () => {};

        expect(() => render(<TestComponent />)).toThrow(/useTheme must be used inside ThemeProvider/);

        // eslint-disable-next-line no-console
        console.error = consoleError;
    });
});
