import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { version } from '../../package.json';
import {
    useThemeEffect,
    getInitialTheme,
    useAutoHideNotification,
    useIframeListener,
    useInitialCodeUpdate,
    defaultPkg
} from '../hooks/useRunnerEffects';
import { buildImports } from '../utils/buildImports';

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

    // --| Use imported defaultPkg if pkg is undefined
    const currentPkg = pkg ?? defaultPkg;

    const [logs, setLogs] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [notification, setNotification] = useState('');
    const [code, setCode] = useState(initialCode ?? `import mod from '${currentPkg}';\nconsole.log(mod);`);
    const [loading, setLoading] = useState(false);

    const [theme, setTheme] = useState(getInitialTheme());
    useThemeEffect(theme);

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    useAutoHideNotification(notification, setNotification);
    useIframeListener(setLogs, setLoading);
    useInitialCodeUpdate(initialCode, code, setCode);

    // --| Run the code in iframe, dynamically resolving ESM imports
    const run = () => {
        setLogs([]);
        setWarnings([]);
        setNotification('');
        setLoading(true);

        if (!code || !code.trim()) {
            setNotification('⚠️ Nothing to run!');
            setLoading(false);

            return;
        }

        const { importLines, transformedCode } = buildImports(code);

        // --| Inject code into iframe and wait for all imports
        iframeRef.current.srcdoc = `
            <!DOCTYPE html>
            <html>
            <body>
                <script type="module">
                    (async () => {
                        const log = console.log;
                        const error = console.error;

                        console.log = (...args) => {
                            parent.postMessage({ type: 'log', args }, '*');
                            log(...args);
                        };

                        console.error = (...args) => {
                            parent.postMessage({ type: 'error', args }, '*');
                            error(...args);
                        };

                        // --| Await all imports first
                        ${importLines}

                        // --| Then run the user code
                        try {
                            ${transformedCode?.split('\n')?.map(line => `        ${line}`)?.join('\n')}
                        } catch (e) {
                            console.error(e);
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

            {/* Popup notification */}
            {notification && (
                <div
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        fontWeight: 'bold',
                        zIndex: 9999
                    }}
                >
                    {notification}
                </div>
            )}

            {/* Console */}
            <div className="runner-console">
                <div className="runner-buttons">
                    <button onClick={run} disabled={loading}>
                        {loading ? '⏳ Loading...' : '▶ Run'}
                    </button>
                    <button onClick={clearEditor}>📝 Clear Editor</button>
                    <button onClick={clearConsole}>🧹 Clear Console</button>
                    <button onClick={toggleTheme}>
                        🌓 {theme === 'dark' ? 'Light' : 'Dark'} Theme
                    </button>
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

                {/* Footer */}
                <div className="runner-footer">
                    <div className="runner-footer-left">
                        <div>
                            📦 NpmRunner <strong>v{version}</strong> — Not affiliated with npm, Inc.
                        </div>
                        <div className="runner-footer-center">
                            ❤️ Made with love by{' '}
                            <a
                                href="https://github.com/tutyamxx"
                                target="_blank"
                                rel="noreferrer"
                                className="runner-footer-link"
                            >
                                tutyamxx
                            </a>
                        </div>
                    </div>

                    <div className="runner-footer-github">
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
                                c0-4.42-3.58-8-8-8z" />
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
