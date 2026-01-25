import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractJsImportCode } from '../utils/extractJsImportCode';

const npmRegistry = 'registry.npmjs.org';

/**
 * The default package name used in the app.
 */
export const defaultPkg = 'contains-emoji';

/**
 * Custom hook to fetch README and derive initial runner code
 *
 * @param {string} pkg - NPM package name
 * @returns {{ readme: string, initialCode: string }}
 */
export const useFetchReadme = (pkg) => {
    const navigate = useNavigate();
    const [readme, setReadme] = useState('');
    const [initialCode, setInitialCode] = useState('');

    useEffect(() => {
        const fetchReadme = async () => {
            // --| Redirect to default package if URL missing pkg
            if (!pkg) {
                navigate(`/sandbox/${defaultPkg}`, { replace: true });

                return;
            }

            try {
                const response = await fetch(`https://${npmRegistry}/${encodeURIComponent(pkg)}`);
                const packageData = await response.json();

                const readmeContent = packageData?.readme ?? 'No README or package found.';
                setReadme(readmeContent);

                // --| Extract first ESM import code block
                const jsBlocks = extractJsImportCode(readmeContent);

                if (jsBlocks?.length > 0) {
                    setInitialCode(jsBlocks?.[0]);
                } else {
                    setInitialCode(`import mod from '${pkg}';\nconsole.log(mod);`);
                }
            // eslint-disable-next-line no-unused-vars
            } catch (_err) {
                setReadme('Package not found!');
                setInitialCode(`import mod from '${pkg}';\nconsole.log(mod);`);
            }
        };

        fetchReadme();
    }, [pkg, navigate]);

    return { readme, initialCode };
};

/**
 * Custom React hook that applies a theme to the document body and persists it in localStorage.
 *
 * This hook:
 * - Sets the `className` of the `<body>` element to the provided theme.
 * - Saves the theme in `localStorage` under the key `'theme'`.
 *
 * @param {'light' | 'dark'} theme - The current theme to apply.
 *
 * @example
 * const [theme, setTheme] = useState('dark');
 * useThemeEffect(theme);
 */
export const useThemeEffect = (theme) => {
    useEffect(() => {
        // --| Apply current theme to body
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);
};

/**
 * Returns the initial theme based on localStorage or defaults to 'dark'.
 *
 * This function checks if the 'theme' key in localStorage is either 'light' or 'dark'.
 * If so, it returns that value; otherwise, it defaults to 'dark'.
 *
 * @returns {'light' | 'dark'} The initial theme to use.
 */
export const getInitialTheme = () => ['light', 'dark'].includes(localStorage?.getItem?.('theme') ?? '') ? localStorage.getItem('theme') : 'dark';

/**
 * Custom React hook that automatically hides a notification after a specified duration.
 *
 * @param {string} notification - The current notification message.
 * @param {function(string): void} setNotification - Function to update the notification state.
 * @param {number} [duration=3000] - Time in milliseconds before the notification is cleared. Defaults to 3000ms.
 *
 * @example
 * const [notification, setNotification] = useState('');
 * useAutoHideNotification(notification, setNotification, 5000);
 */
export const useAutoHideNotification = (notification, setNotification, duration = 3000) => {
    useEffect(() => {
        if (!notification) return;

        const timer = setTimeout(() => setNotification(''), duration);

        return () => clearTimeout(timer);
    }, [notification, setNotification, duration]);
};

/**
 * Creates a JSON.stringify replacer function that safely handles circular references.
 *
 * When passed to `JSON.stringify`, this replacer will:
 * - Keep track of objects already seen.
 * - Replace circular references with the string `"[Circular]"` instead of throwing an error.
 *
 * @returns {function(string, any): any} A replacer function compatible with `JSON.stringify`.
 *
 * @example
 * const obj = {};
 * obj.self = obj;
 * console.log(JSON.stringify(obj, getCircularReplacer()));
 * // Output: '{"self":"[Circular]"}'
 */
export const getCircularReplacer = () => {
    // --| Keep track of already seen objects to prevent infinite recursion
    const seenObjects = new WeakSet();

    // --| Replacer function used by JSON.stringify
    return (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seenObjects.has(value)) {
                return '[Circular]';
            }

            seenObjects.add(value);
        }

        return value;
    };
};

/**
 * Custom React hook to listen for `postMessage` events from an iframe and update logs and loading state.
 *
 * This hook:
 * - Listens for messages posted to `window`.
 * - Safely formats arguments, including handling circular references.
 * - Updates a logs state array with objects containing `type` ('log' | 'error') and formatted `text`.
 * - Stops a loading state when a message of type `'done'` is received.
 *
 * @param {function(Array<{type: string, text: string}>): void} setLogs - State setter for logs array.
 * @param {function(boolean): void} setLoading - State setter for loading indicator.
 *
 * @example
 * const [logs, setLogs] = useState([]);
 * const [loading, setLoading] = useState(true);
 * useIframeListener(setLogs, setLoading);
 */
export const useIframeListener = (setLogs, setLoading) => {
    useEffect(() => {
        // --| Helper to safely stringify objects/arrays with circular references
        const formatArg = (arg) => {
            try {
                return typeof arg === 'object' && arg !== null
                    ? JSON.stringify(arg, getCircularReplacer(), 2)
                    : String(arg ?? '');
            } catch {
                return String(arg ?? '');
            }
        };

        const messageHandler = (msgEvent) => {
            const args = msgEvent?.data?.args ?? [];
            const type = msgEvent?.data?.type ?? 'log';

            if (type === 'log' || type === 'error') {
                setLogs((current) => [
                    ...current,
                    ...args.map((arg) => ({ type, text: formatArg(arg) }))
                ]);
            }

            if (type === 'done') setLoading(false);
        };

        window.addEventListener('message', messageHandler);

        return () => window.removeEventListener('message', messageHandler);
    }, [setLogs, setLoading]);
};

/**
 * Custom React hook to set the initial code into a state variable if the current code is empty.
 *
 * This is useful for initializing a code editor or similar component with default content.
 *
 * @param {string} initialCode - The initial code value to set.
 * @param {string} code - The current code state.
 * @param {function(string): void} setCode - Function to update the code state.
 *
 * @example
 * const [code, setCode] = useState('');
 * useInitialCodeUpdate('console.log("Hello World");', code, setCode);
 */
export const useInitialCodeUpdate = (initialCode, code, setCode) => {
    useEffect(() => {
        if (!code && initialCode) {
            setCode(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);
};
