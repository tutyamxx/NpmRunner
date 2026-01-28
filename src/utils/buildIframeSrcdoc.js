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
    // --| Convert the circular replacer into a string to inject into the iframe
    const circularReplacerString = `
        const replacer = (${getCircularReplacer.toString()})();

        function safeStringify(obj) {
            return JSON.stringify(obj, replacer, 2);
        }
    `;

    return `
        <!DOCTYPE html>
        <html>
        <body>
            <script type="module">
                (async () => {
                    const log = console.log;
                    const error = console.error;

                    // --| Inject safe stringify from shared hook
                    ${circularReplacerString}

                    // --| Override console.log to stringify objects safely
                    console.log = (...args) => {
                        const formattedArgs = args.map(arg =>
                            typeof arg === 'object' && arg !== null
                                ? safeStringify(arg)
                                : String(arg)
                        );

                        parent.postMessage({ type: 'log', args: formattedArgs }, '*');
                        log(...args);
                    };

                    // --| Override console.error to stringify objects safely
                    console.error = (...args) => {
                        const formattedArgs = args.map(arg =>
                            typeof arg === 'object' && arg !== null
                                ? safeStringify(arg)
                                : String(arg)
                        );

                        parent.postMessage({ type: 'error', args: formattedArgs }, '*');
                        error(...args);
                    };

                    // --| Await all imports first
                    ${importLines}

                    // --| Then run the user code
                    try {
                        ${transformedCode?.split('\n')?.map(line => `        ${line}`)?.join('\n')}
                    } catch (e) {
                        parent.postMessage({ type: 'error', args: [e?.message || String(e)] }, '*');
                    } finally {
                        // --| Notify parent that execution is done
                        parent.postMessage({ type: 'done' }, '*');
                    }
                })();
            </script>
        </body>
        </html>
    `;
};
