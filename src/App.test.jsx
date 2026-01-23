import { render, screen as rtlScreen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./Sandbox', () => ({ default: () => <div>Sandbox Component</div> }));

import App from './App';

describe('App Routing', () => {
    it('Renders Sandbox component at /sandbox', () => {
        window.history.pushState({}, 'Sandbox page', '/sandbox');

        render(<App />);
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox/some-package', () => {
        window.history.pushState({}, 'Sandbox page', '/sandbox/some-package');

        render(<App />);
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });
});
