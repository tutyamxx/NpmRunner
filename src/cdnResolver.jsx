/**
 * Creates a CDN resolver plugin for esbuild that resolves any module path
 * to a JSDelivr CDN URL using the ESM build.
 *
 * @returns {import('esbuild').Plugin} The esbuild plugin object
 */
const cdnResolver = () => ({
    name: 'cdn-resolver',

    setup(build) {
        // --| Intercepts module resolution.
        // --| If the path starts with 'http', it lets esbuild handle it.
        // --| Otherwise, rewrites it to a JSDelivr CDN URL.
        build.onResolve({ filter: /.*/ }, (args) => {
            if (args?.path?.startsWith('http')) {
                return null;
            }

            return {
                path: `https://cdn.jsdelivr.net/npm/${args?.path ?? ''}/+esm`,
                namespace: 'cdn'
            };
        });

        // --| Loads modules from the CDN.
        // --| Fetches the module text and returns it to esbuild with JS loader.
        build.onLoad({ filter: /.*/, namespace: 'cdn' }, async (args) => {
            const response = await fetch(args?.path ?? '');

            return {
                contents: await response?.text?.(),
                loader: 'js'
            };
        });
    }
});

export default cdnResolver;
