import { render, screen as rtlScreen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Runner from './Runner';

vi.mock('@monaco-editor/react', () => ({
    default: ({ value, onChange }) => (
        <textarea
            data-testid="monaco-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

describe('Runner Component', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('Renders editor with initial code', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);
        expect(rtlScreen.getByTestId('monaco-editor')).toHaveValue('console.log(\'hi\')');
    });

    it('Shows error notification if code is empty and Run is pressed', () => {
        render(<Runner pkg="test-package" initialCode="" />);

        const runButton = rtlScreen.getByRole('button', { name: /run/i });
        fireEvent.click(runButton);

        expect(rtlScreen.getByText(/nothing to run/i)).toBeInTheDocument();
        expect(runButton).not.toBeDisabled();
    });

    it('Disables Run button while code is running', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);
        const runButton = rtlScreen.getByRole('button', { name: /run/i });

        fireEvent.click(runButton);
        expect(runButton).toBeDisabled();
        expect(runButton).toHaveTextContent(/loading/i);

        // --| Simulate iframe sending 'done' message
        fireEvent(window, new MessageEvent('message', { data: { type: 'done' } }));
        expect(runButton).not.toBeDisabled();
        expect(runButton).toHaveTextContent(/run/i);
    });

    it('Clears editor when Clear Editor is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        fireEvent.click(rtlScreen.getByText(/clear editor/i));
        expect(rtlScreen.getByTestId('monaco-editor')).toHaveValue('');
    });

    it('Clears console when Clear Console is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        const runButton = rtlScreen.getByRole('button', { name: /run/i });
        fireEvent.click(runButton);

        fireEvent(window, new MessageEvent('message', { data: { type: 'log', args: ['hi'] } }));
        expect(document.querySelector('.runner-logs')).toHaveTextContent(/hi/i);

        fireEvent.click(rtlScreen.getByRole('button', { name: /clear console/i }));
        const logsContainer = document.querySelector('.runner-logs');
        expect(logsContainer).toBeEmptyDOMElement();
    });

    it('Toggles theme when Light Theme button is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        const themeButton = rtlScreen.getByRole('button', { name: /light theme/i });
        fireEvent.click(themeButton);
        expect(document.body.className).toMatch(/light/i);
    });

    it('Does not crash if Run is pressed with valid code', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        const runButton = rtlScreen.getByRole('button', { name: /run/i });
        fireEvent.click(runButton);

        const logsContainer = document.querySelector('.runner-logs');
        expect(logsContainer).toBeInTheDocument();

        fireEvent(window, new MessageEvent('message', { data: { type: 'log', args: ['hi'] } }));
        expect(logsContainer).toHaveTextContent(/hi/i);
    });
});
