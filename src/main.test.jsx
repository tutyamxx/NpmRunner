import { render, screen as rtlScreen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { vi } from 'vitest';

// --| Mock Sandbox so we don't load actual component
vi.mock('./Sandbox', () => ({ default: () => <div>Sandbox Component</div> }));

describe('🏖️ App entry point routing', () => {
    it('Renders Sandbox component at /sandbox', () => {
        render(
            <MemoryRouter initialEntries={['/sandbox']}>
                <Routes>
                    <Route path="/sandbox/*" element={<div>Sandbox Component</div>} />
                    <Route path="*" element={<Navigate to="/sandbox/contains-emoji" replace />} />
                </Routes>
            </MemoryRouter>
        );

        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Redirects unknown route to /sandbox/contains-emoji', () => {
        render(
            <MemoryRouter initialEntries={['/unknown']}>
                <Routes>
                    <Route path="/sandbox/*" element={<div>Sandbox Component</div>} />
                    <Route path="*" element={<Navigate to="/sandbox/contains-emoji" replace />} />
                </Routes>
            </MemoryRouter>
        );

        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox with a simple package param', () => {
        render(
            <MemoryRouter initialEntries={['/sandbox/some-package']}>
                <Routes>
                    <Route path="/sandbox/*" element={<div>Sandbox Component</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox with a scoped package param', () => {
        // --| Encode scoped package as a single URL segment
        render(
            <MemoryRouter initialEntries={['/sandbox/@slidoapp%2Fqrcode']}>
                <Routes>
                    <Route path="/sandbox/*" element={<div>Sandbox Component</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });

    it('Renders Sandbox with a scoped package + subpath', () => {
        // --| Encode the main package only, keep subpath literal
        render(
            <MemoryRouter initialEntries={['/sandbox/@slidoapp%2Fqrcode/sub/path']}>
                <Routes>
                    <Route path="/sandbox/*" element={<div>Sandbox Component</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(rtlScreen.getByText('Sandbox Component')).toBeInTheDocument();
    });
});
