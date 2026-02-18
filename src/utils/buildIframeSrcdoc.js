import { getCircularReplacer } from '../hooks/useRunnerEffects';

/**
 * Builds the HTML content for the iframe that executes user code.
 *
 * This function generates a complete `srcdoc` string for the iframe. It:
 * - Overrides `console.log` and `console.error` to post messages to the parent.
 * - Safely stringifies objects to handle circular references.
 * - Injects dynamic import lines and transformed user code.
 * TODO: Add more stuff and properly check for things
 *
 * @param {string} importLines - JS lines to dynamically import modules before running user code.
 * @param {string} transformedCode - The transformed user code to execute inside the iframe.
 * @returns {string} The full HTML string for the iframe's `srcdoc`.
 */
export const buildIframeSrcdoc = (importLines, transformedCode) => {
    // --| Capture the parent origin to secure postMessage communication
    const appOrigin = window.location.origin;

    const internalHelpers = `
        const replacer = (${getCircularReplacer.toString()})();

        const safeStringify = (obj) => {
            try {
                // --| Handle Error objects specifically (JSON.stringify returns {} for Errors otherwise)
                if (obj instanceof Error) {
                    return JSON.stringify({
                        name: obj.name,
                        message: obj.message,
                    }, null, 2);
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

                // --| Global Error Handling (for sync and async errors)
                window.onerror = (msg, url, line, col, error) => {
                    sandboxEmit('error', [error ?? msg]);

                    return false;
                };

                window.onunhandledrejection = (event) => {
                    sandboxEmit('error', [event?.reason ?? 'Unhandled Promise Rejection']);
                }

                // --| Centralized Console Overrides
                ['log', 'error', 'warn', 'info'].forEach(level => {
                    const original = console?.[level];

                    console[level] = (...args) => {
                        sandboxEmit(level, args);
                        original?.apply(console, args);
                    };
                });

                // --| Execution Environment
                (async () => {
                    try {
                        // --| Dynamically import modules
                        ${importLines}

                        // --| Execute the transformed user code
                        ${transformedCode}

                    } catch (e) {
                        // --| Catch any errors during import or execution
                        sandboxEmit('error', [e]);
                    } finally {
                        // --| Notify parent that execution has finished
                        parent.postMessage({ type: 'done' }, '${appOrigin}');
                    }
                })();
            </script>
        </body>
        </html>
    `;
};
