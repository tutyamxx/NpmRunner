import { render, screen as rtlScreen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// --| Mock Runner so it doesn’t actually execute code
vi.mock('./Runner', () => ({
    default: ({ pkg, initialCode }) => (
        <div>
            Runner Component: {pkg} | {initialCode}
        </div>
    )
}));

import Sandbox from './Sandbox';

const mockFetch = (body) => vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });

describe('Sandbox Component', () => {
    afterEach(() => vi.restoreAllMocks());

    it('Renders README and first import block', async () => {
        globalThis.fetch = mockFetch({
            readme: `
                # Test Package

                \`\`\`js
                import something from 'somewhere';
                console.log(something);
                \`\`\`
            `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/test-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Test Package/i)).toBeInTheDocument());
        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: test-package \| import something from 'somewhere';/i)).toBeInTheDocument());
    });

    it('Uses default code if no import blocks', async () => {
        globalThis.fetch = mockFetch({
            readme: `
                # Empty README

                \`\`\`js
                console.log('no import here');
                \`\`\`
            `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/test-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: test-package \| import mod from 'test-package';/i)).toBeInTheDocument());
    });

    it('Shows "Package not found!" if fetch fails', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('fail'));

        render(
            <MemoryRouter initialEntries={['/sandbox/test-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(rtlScreen.getByText('Package not found!')).toBeInTheDocument();
            expect(rtlScreen.getByText(/Runner Component: test-package \| import mod from 'test-package';/i)).toBeInTheDocument();
        });
    });

    // TODO - more tests
});
