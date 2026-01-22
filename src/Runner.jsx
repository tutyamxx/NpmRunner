import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

/**
 * Runner component: executes JS code in an iframe,
 * dynamically loads imports via ESM, and displays logs.
 *
 * @param {Object} props
 * @param {string} props.pkg - NPM package name
 * @param {string} [props.initialCode] - Optional initial code to pre-fill editor
 * @component
 */
const Runner = ({ pkg, initialCode }) => {
    const iframeRef = useRef(null);
    const defaultPkg = pkg ?? 'orc-me';

    const [logs, setLogs] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [code, setCode] = useState(initialCode ?? `import mod from '${defaultPkg}';\nconsole.log(mod);`);

    // --| Update code if initialCode changes and is different
    useEffect(() => {
        if (initialCode && initialCode !== code) {
            setCode(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);

    // --| Listen for logs/errors from iframe
    useEffect(() => {
        const handler = (event) => {
            const args = event?.data?.args ?? [];
            const type = event?.data?.type ?? 'log';

            setLogs((current) => [
                ...current,
                ...args.map((arg) => ({ type, text: String(arg ?? '') })),
            ]);
        };

        window.addEventListener('message', handler);

        return () => window.removeEventListener('message', handler);
    }, []);

    /**
     * Run the code in iframe, dynamically resolving ESM imports
     */
    const run = () => {
        setLogs([]);
        setWarnings([]);

        // --| Extract import statements
        const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(code ?? ''))) {
            imports.push({ specifier: match?.[1] ?? '', packageName: match?.[2] ?? '' });
        }

        // --| Remove import statements from code
        const transformedCode = (code ?? '').replace(importRegex, '');

        // --| Create dynamic import scripts
        const scripts = imports.map(
                ({ packageName, specifier }) => `
            <script type="module">
                import * as module from 'https://esm.run/${packageName ?? ''}';
                window.${specifier ?? ''} = module?.default ?? module;
            </script>
        `).join('');

        // --| Inject code into iframe
        iframeRef.current.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>${scripts}</head>
            <body>
                <script type="module">
                    const log = console.log;
                    const error = console.error;

                    console.log = (...args) => { parent.postMessage({ type: 'log', args }, '*'); log(...args); };
                    console.error = (...args) => { parent.postMessage({ type: 'error', args }, '*'); error(...args); };

                    try {
                        ${transformedCode?.split('\n')?.map((line) => '        ' + line)?.join('\n')}
                    } catch(e) {
                        console.error(e);
                    }
                </script>
            </body>
            </html>
        `;
    };

    return (
        <div className="runner-container">
            {/* Editor */}
            <div className="runner-editor">
                <Editor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={code ?? ''}
                    onChange={(value) => setCode(value ?? '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        wordWrap: 'on'
                    }}
                />
            </div>

            {/* Console */}
            <div className="runner-console">
                <button
                    onClick={run}
                    className="runner-run-button"
                >
                    ▶ Run
                </button>

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="runner-warnings">
                        {warnings.map((w, i) => (
                            <div key={i}>{w?.text ?? ''}</div>
                        ))}
                    </div>
                )}

                {/* Logs */}
                <pre className="runner-logs">
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className={`runner-log ${log?.type === 'error' ? 'runner-log-error' : ''}`}
                        >
                            {log?.text ?? ''}
                        </div>
                    ))}
                </pre>

                {/* Footer in bottom-right */}
                <div className="runner-footer">
                    📦 NpmRunner - Not affiliated with npm, Inc.
                </div>

                <iframe ref={iframeRef} sandbox="allow-scripts" style={{ display: 'none' }} />
            </div>
        </div>
    );
};

export default Runner;
