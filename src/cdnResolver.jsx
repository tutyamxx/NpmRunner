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
        // --| If the path starts with 'http', let esbuild handle it.
        // --| Otherwise, rewrite it to a JSDelivr CDN URL with encoding.
        build.onResolve({ filter: /.*/ }, (args) => {
            if (args?.path?.startsWith('http')) {
                return null;
            }

            const encodedPath = encodeURIComponent(args?.path ?? '');

            return {
                path: `https://cdn.jsdelivr.net/npm/${encodedPath}/+esm`,
                namespace: 'cdn'
            };
        });

        // --| Loads modules from the CDN.
        // --| Fetches the module text and returns it to esbuild with JS loader.
        build.onLoad({ filter: /.*/, namespace: 'cdn' }, async (args) => {
            const response = await fetch(args?.path ?? '');

            if (!response.ok) {
                throw new Error(`Failed to load module from CDN: ${args.path}`);
            }

            return {
                contents: await response.text(),
                loader: 'js'
            };
        });
    }
});

export default cdnResolver;
