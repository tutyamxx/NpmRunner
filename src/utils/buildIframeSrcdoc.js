import { getCircularReplacer } from '../hooks/useRunnerEffects';

/**
 * Builds the HTML content for the iframe that executes user code.
 *
 * Overrides console methods to post messages to the parent, safely stringifies objects
 * (circular references, Errors), and injects the import lines and user code.
 *
 * @param   {string} importLines     - JS lines that dynamically import modules before the user code runs.
 * @param   {string} transformedCode - The transformed user code to execute inside the iframe.
 * @returns {string}                 The full HTML string for the iframe's `srcdoc`.
 */
export const buildIframeSrcdoc = (importLines, transformedCode) => {
    // --| Capture the parent origin to secure postMessage communication
    const appOrigin = window?.location?.origin;

    // --| Stop user code from closing the inline <script> tag early (null/undefined safe)
    const escapeScript = (str) => String(str ?? '').replace(/<\/script/gi, '<\\/script');

    const internalHelpers = `
        const replacer = (${getCircularReplacer?.toString()})();

        const safeStringify = (obj) => {
            try {
                // --| JSON.stringify returns {} for Errors otherwise
                if (obj instanceof Error) {
                    return JSON.stringify({ name: obj.name, message: obj.message }, null, 2);
                }

                return JSON.stringify(obj, replacer, 2);
            } catch (e) {
                return "[Unserializable Object]";
            }
        };

        const formatArg = (arg) => (typeof arg === 'object' && arg !== null ? safeStringify(arg) : String(arg));
        const sandboxEmit = (type, args) => parent.postMessage({ type, args: args.map(formatArg) }, '${appOrigin}');
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <body>
            <script type="module">
                ${internalHelpers}

                // --| Global error handling (sync and async)
                window.onerror = (msg, url, line, col, error) => {
                    sandboxEmit('error', [error ?? msg]);

                    return false;
                };

                window.onunhandledrejection = (event) => {
                    sandboxEmit('error', [event?.reason ?? 'Unhandled Promise Rejection']);
                };

                // --| Console overrides
                ['log', 'error', 'warn', 'info'].forEach((level) => {
                    const original = console[level].bind(console);

                    console[level] = (...args) => {
                        sandboxEmit(level, args);
                        original(...args);
                    };
                });

                // --| Execution environment
                (async () => {
                    try {
                        ${escapeScript(importLines)}

                        ${escapeScript(transformedCode)}
                    } catch (e) {
                        sandboxEmit('error', [e]);
                    } finally {
                        parent.postMessage({ type: 'done' }, '${appOrigin}');
                    }
                })();
            </script>
        </body>
        </html>
    `;
};
