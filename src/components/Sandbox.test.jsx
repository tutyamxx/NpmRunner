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

    it('Selects first import-containing JS block when multiple exist', async () => {
        globalThis.fetch = mockFetch({
            readme: `
                # Multi-block

                \`\`\`js
                console.log('no import');
                \`\`\`

                \`\`\`js
                import foo from 'foo';
                console.log(foo);
                \`\`\`

                \`\`\`js
                import bar from 'bar';
                console.log(bar);
                \`\`\`
            `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/multi-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(rtlScreen.getByText(/Runner Component: multi-package \| import foo from 'foo';/i)).toBeInTheDocument();
        });
    });

    it('Uses default code if README has no JS code blocks', async () => {
        globalThis.fetch = mockFetch({
            readme: `
                # No JS

                Some text here
            `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/no-js']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(rtlScreen.getByText(/Runner Component: no-js \| import mod from 'no-js';/i)).toBeInTheDocument();
        });
    });

    it('Handles simple require() statements', async () => {
        globalThis.fetch = mockFetch({
            readme: `
            # Require Test

            \`\`\`js
            const lodash = require('lodash');
            console.log(lodash);
            \`\`\`
        `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/require-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: require-package \| const lodash = require\('lodash'\);/i)).toBeInTheDocument());
    });

    it('Handles destructured require() statements', async () => {
        globalThis.fetch = mockFetch({
            readme: `
            # Destructured Require Test

            \`\`\`js
            const { map, filter } = require('lodash');
            console.log(map, filter);
            \`\`\`
        `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/destructured-require']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: destructured-require \| const { map, filter } = require\('lodash'\);/i)).toBeInTheDocument());
    });

    it('Uses default code if README has require() with no imports', async () => {
        globalThis.fetch = mockFetch({
            readme: `
            # Require Without Import

            \`\`\`js
            console.log('Hello CommonJS');
            \`\`\`
        `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/no-require-import']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: no-require-import \| import mod from 'no-require-import';/i)).toBeInTheDocument());
    });

    it('Selects first import block even if a require block appears first', async () => {
        globalThis.fetch = mockFetch({
            readme: `
            # Mixed Imports

            \`\`\`js
            const lodash = require('lodash');
            console.log(lodash);
            \`\`\`

            \`\`\`js
            import axios from 'axios';
            console.log(axios);
            \`\`\`
        `
        });

        render(
            <MemoryRouter initialEntries={['/sandbox/mixed-imports-package']}>
                <Routes>
                    <Route path="/sandbox/:pkg?" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Runner Component: mixed-imports-package \| import axios from 'axios';/i)).toBeInTheDocument());
    });
});
