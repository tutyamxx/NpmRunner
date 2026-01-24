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

        fireEvent.click(rtlScreen.getByRole('button', { name: /run/i }));
        expect(rtlScreen.getByText(/nothing to run/i)).toBeInTheDocument();
    });

    it('Clears editor when Clear Editor is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        fireEvent.click(rtlScreen.getByText(/clear editor/i));
        expect(rtlScreen.getByTestId('monaco-editor')).toHaveValue('');
    });

    it('Clears console when Clear Console is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        fireEvent.click(rtlScreen.getByRole('button', { name: /run/i }));
        expect(rtlScreen.getByText(/hi/i)).toBeInTheDocument();

        fireEvent.click(rtlScreen.getByRole('button', { name: /clear console/i }));

        const logsContainer = document.querySelector('.runner-logs');
        expect(logsContainer).toBeEmptyDOMElement();
    });

    it('Toggles theme when Light Theme button is clicked', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        fireEvent.click(rtlScreen.getByRole('button', { name: /light theme/i }));
        expect(document.body.className).toMatch(/light/i);
    });

    it('Does not crash if Run is pressed with valid code', () => {
        render(<Runner pkg="test-package" initialCode="console.log('hi')" />);

        fireEvent.click(rtlScreen.getByRole('button', { name: /run/i }));
        expect(rtlScreen.getByTestId('monaco-editor')).toBeInTheDocument();

        const logsContainer = document.querySelector('.runner-logs');
        expect(logsContainer).toBeInTheDocument();

        fireEvent(window, new MessageEvent('message', {
            data: { type: 'log', args: ['hi'] }
        }));

        expect(logsContainer).toHaveTextContent(/hi/i);
    });
});
