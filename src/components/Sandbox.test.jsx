import { render, screen as rtlScreen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// --| Mock KaTeX CSS import so tests don't try to append to document.head
vi.mock('katex/dist/katex.min.css', () => ({}));
vi.mock('rehype-katex', () => ({
    __esModule: true,
    default: () => null
}));

import Sandbox from './Sandbox';

const mockFetch = (body) => vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => body })                                                        // --| README
    .mockResolvedValueOnce({ ok: true, json: async () => ({ repository: { url: 'https://github.com/test/repo' } }) });  // --| repository metadata

describe('🏖️ Sandbox Component', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(rtlScreen.getByText(/Test Package/i)).toBeInTheDocument());

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('test-package');
            expect(el.textContent).toContain('import something from \'somewhere\';');
        });
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('test-package');
            expect(el.textContent).toContain('import mod from \'test-package\';');
        });
    });

    it('Shows "Package not found!" if fetch fails', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('fail'));

        render(
            <MemoryRouter initialEntries={['/sandbox/test-package']}>
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(rtlScreen.getByText('Package not found!')).toBeInTheDocument();

            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('test-package');
            expect(el.textContent).toContain('import mod from \'test-package\';');
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('multi-package');
            expect(el.textContent).toContain('import foo from \'foo\';');
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('no-js');
            expect(el.textContent).toContain('import mod from \'no-js\';');
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('require-package');
            expect(el.textContent).toContain('const lodash = require(\'lodash\');');
        });
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('destructured-require');
            expect(el.textContent).toContain('const { map, filter } = require(\'lodash\');');
        });
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
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const el = rtlScreen.getByText(/Runner Component:/i);
            expect(el.textContent).toContain('no-require-import');
            expect(el.textContent).toContain('import mod from \'no-require-import\';');
        });
    });

    it('Prefills search input from route param', async () => {
        globalThis.fetch = mockFetch({ readme: '# Test' });

        render(
            <MemoryRouter initialEntries={['/sandbox/lodash']}>
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await rtlScreen.findByDisplayValue('lodash')).toBeInTheDocument();
    });

    it('Shows search results when typing', async () => {
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ readme: '# Test' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ repository: { url: 'https://github.com/test/repo' } }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    objects: [
                        { package: { name: 'lodash' } },
                        { package: { name: 'lodash-es' } }
                    ]
                })
            });

        render(
            <MemoryRouter initialEntries={['/sandbox/test']}>
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        const input = await rtlScreen.findByRole('textbox');

        await userEvent.clear(input);
        await userEvent.type(input, 'lo');

        await waitFor(() => {
            expect(rtlScreen.getByText('lodash')).toBeInTheDocument();
            expect(rtlScreen.getByText('lodash-es')).toBeInTheDocument();
        });
    });

    it('Navigates when selecting a search result', async () => {
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ readme: '# Test' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ repository: { url: 'https://github.com/test/repo' } }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    objects: [
                        { package: { name: 'axios' } }
                    ]
                })
            });

        render(
            <MemoryRouter initialEntries={['/sandbox/test']}>
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        const input = await rtlScreen.findByRole('textbox');

        await userEvent.clear(input);
        await userEvent.type(input, 'ax');

        const item = await rtlScreen.findByText('axios');

        await userEvent.click(item);

        await waitFor(() => expect(input).toHaveValue('axios'));
    });

    it('Hides search results when clicking outside', async () => {
        globalThis.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ readme: '# Test' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ repository: { url: 'https://github.com/test/repo' } }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    objects: [
                        { package: { name: 'lodash' } }
                    ]
                })
            });

        render(
            <MemoryRouter initialEntries={['/sandbox/test']}>
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        const input = await rtlScreen.findByRole('textbox');

        await userEvent.type(input, 'lo');

        expect(await rtlScreen.findByText('lodash')).toBeInTheDocument();

        await userEvent.click(document.body);

        await waitFor(() => expect(rtlScreen.queryByText('lodash')).not.toBeInTheDocument()
        );
    });

    it('Renders search input', async () => {
        globalThis.fetch = mockFetch({ readme: '# Test' });

        render(
            <MemoryRouter initialEntries={['/sandbox/test']} >
                <Routes>
                    <Route path="/sandbox/*" element={<Sandbox />} />
                </Routes>
            </MemoryRouter>
        );

        const input = await rtlScreen.findByRole('textbox');
        expect(input).toBeInTheDocument();
    });
});
