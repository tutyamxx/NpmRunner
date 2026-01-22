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

    const [theme, setTheme] = useState('dark');
    const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    useEffect(() => {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

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

    // --| Run the code in iframe, dynamically resolving ESM imports
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
        const scripts = imports.map(({ packageName, specifier }) => `
            <script type="module">
                import * as module from 'https://esm.sh/${packageName ?? ''}';
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

    // --| Clear the editor content
    const clearEditor = () => setCode('');

    // --| Clear the console logs
    const clearConsole = () => setLogs([]);

    return (
        <div className="runner-container">

            {/* Editor */}
            <div className="runner-editor">
                <Editor
                    height="100%"
                    language="javascript"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
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
               <div className="runner-buttons">
                <button onClick={run}>▶ Run</button>
                <button onClick={clearEditor}>📝 Clear Editor</button>
                <button onClick={clearConsole}>🧹 Clear Console</button>
                <button onClick={toggleTheme}>🌓 {theme === 'dark' ? 'Light' : 'Dark'} Theme</button>
            </div>

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
                    <div>
                        📦 NpmRunner — Not affiliated with npm, Inc.
                    </div>
                    <div>
                        <a
                            href="https://github.com/tutyamxx/NpmRunner"
                            target="_blank"
                            rel="noreferrer"
                            className="runner-footer-link"
                            aria-label="GitHub repository"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                style={{ verticalAlign: 'text-bottom', marginRight: '4px' }}
                            >
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
                                -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
                                -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
                                0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27
                                1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
                                0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
                                0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8
                                c0-4.42-3.58-8-8-8z"/>
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>

                <iframe ref={iframeRef} sandbox="allow-scripts" style={{ display: 'none' }} />
            </div>
        </div>
    );
};

export default Runner;
