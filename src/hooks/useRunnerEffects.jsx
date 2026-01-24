import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractJsImportCode } from '../utils/extractJsImportCode';

const npmRegistry = 'registry.npmjs.org';

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
 * Apply theme to body and persist in localStorage
 *
 * @param {string} theme - Current theme ('`light`' or '`dark`')
 */
export const useThemeEffect = (theme) => {
    useEffect(() => {
        // --| Apply current theme to body
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);
};

/**
 * Get initial theme from localStorage or default
 */
export const getInitialTheme = () => ['light', 'dark'].includes(localStorage?.getItem?.('theme') ?? '') ? localStorage.getItem('theme') : 'dark';

/**
 * Auto-hide notifications after a timeout
 */
export const useAutoHideNotification = (notification, setNotification, duration = 3000) => {
    useEffect(() => {
        if (!notification) return;

        const timer = setTimeout(() => setNotification(''), duration);

        return () => clearTimeout(timer);
    }, [notification, setNotification, duration]);
};

/**
 * Handle circular references in objects for JSON.stringify
 */
export const getCircularReplacer = () => {
    const seen = new WeakSet();

    return (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }

            seen.add(value);
        }

        return value;
    };
};

/**
 * Listen for messages from iframe (logs, errors, done)
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
 * Update code if initialCode changes
 * Does NOT overwrite if code is empty (allowing clearEditor to work)
 */
export const useInitialCodeUpdate = (initialCode, code, setCode) => {
    useEffect(() => {
        if (!code && initialCode) {
            setCode(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);
};
