import { vi } from 'vitest';
import cdnResolver from './cdnResolver';

let resolveCallback;
let loadCallback;

describe('cdnResolver esbuild plugin', () => {
    it('Registers onResolve and onLoad hooks', () => {
        const build = {
            onResolve: vi.fn(),
            onLoad: vi.fn()
        };

        const plugin = cdnResolver();
        plugin.setup(build);

        expect(build.onResolve).toHaveBeenCalled();
        expect(build.onLoad).toHaveBeenCalled();
    });

    it('Rewrites non-http paths to jsdelivr CDN URL', async () => {
        const build = {
            onResolve: (_opts, cb) => {
                resolveCallback = cb;
            },
            onLoad: vi.fn()
        };

        const plugin = cdnResolver();
        plugin.setup(build);

        const args = { path: 'lodash' };
        const result = await resolveCallback(args);

        expect(result.path).toBe('https://cdn.jsdelivr.net/npm/lodash/+esm');
        expect(result.namespace).toBe('cdn');
    });

    it('Lets http URLs pass through', async () => {
        const build = {
            onResolve: (_opts, cb) => {
                resolveCallback = cb;
            },
            onLoad: vi.fn()
        };

        const plugin = cdnResolver();
        plugin.setup(build);

        const args = { path: 'http://example.com/foo.js' };
        const result = await resolveCallback(args);

        expect(result).toBeNull();
    });

    it('Loads module contents from CDN', async () => {
        const fakeJs = 'export const a = 123;';

        globalThis.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            text: () => Promise.resolve(fakeJs)
        }));

        const build = {
            onResolve: vi.fn(),
            onLoad: (_opts, cb) => {
                loadCallback = cb;
            }
        };

        const plugin = cdnResolver();
        plugin.setup(build);

        const args = { path: 'https://cdn.jsdelivr.net/npm/lodash/+esm', namespace: 'cdn' };
        const result = await loadCallback(args);

        expect(result.contents).toBe(fakeJs);
        expect(result.loader).toBe('js');
    });

    it('Throws if fetch fails', async () => {
        globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false }));

        const build = {
            onResolve: vi.fn(),
            onLoad: (_opts, cb) => {
                loadCallback = cb;
            }
        };

        const plugin = cdnResolver();
        plugin.setup(build);

        const args = { path: 'https://cdn.jsdelivr.net/npm/unknown/+esm', namespace: 'cdn' };

        await expect(loadCallback(args)).rejects.toThrow(/Failed to load module from CDN/);
    });
});
