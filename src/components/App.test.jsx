import { render, screen as rtlScreen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./Sandbox', () => ({ default: () => <div>Sandbox Component</div> }));

import App from './App';

describe('App Routing', () => {
    const renderAt = (path) => {
        window.history.pushState({}, 'Test page', path);
        render(<App />);
    };

    it('Renders Sandbox component at /sandbox', () => {
        renderAt('/sandbox');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox/some-package', () => {
        renderAt('/sandbox/some-package');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox/another-package', () => {
        renderAt('/sandbox/another-package');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox/ with empty param', () => {
        renderAt('/sandbox/');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox?query=123', () => {
        renderAt('/sandbox?query=123');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox component at /sandbox/some-package?foo=bar', () => {
        renderAt('/sandbox/some-package?foo=bar');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Handles trailing slash variations', () => {
        renderAt('/sandbox//');
        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Unknown routes do not render Sandbox', () => {
        renderAt('/unknown-route');
        expect(rtlScreen.queryByText('Sandbox Component')).not.toBeInTheDocument();
    });

    it('Root / does not render Sandbox', () => {
        renderAt('/');
        expect(rtlScreen.queryByText('Sandbox Component')).not.toBeInTheDocument();
    });
});
