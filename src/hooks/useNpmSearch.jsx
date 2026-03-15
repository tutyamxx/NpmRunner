import { useState, useEffect } from 'react';
import { npmRegistry } from './useRunnerEffects';

/**
 * Performs debounced search on the npm registry for a given query.
 *
 * @param {string} query - The search query string
 * @returns {Object} { results, loading, clearResults }
 */
export const useNpmSearch = (query) => {
    // --| Search results state
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const trimmedQuery = query?.trim();

        if (!trimmedQuery || trimmedQuery.length < 2) {
            setResults([]);
            setLoading(false);

            return;
        }

        let isCurrentQuery = true;
        const controller = new AbortController();

        // --| Debounce search by 300ms
        const timer = setTimeout(async () => {
            setLoading(true);

            try {
                const response = await fetch(`https://${npmRegistry}/-/v1/search?text=${encodeURIComponent(`${trimmedQuery}`)}&size=50`, { signal: controller.signal });

                if (!response.ok) {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.error(`Failed NPM search for "${trimmedQuery}": ${response.status} ${response.statusText}`);
                    }

                    return;
                }

                const data = await response.json();

                if (isCurrentQuery) {
                    setResults(data?.objects ?? []);
                }
            } catch (error) {
                if (error.name !== 'AbortError' && isCurrentQuery) {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.error(error);
                    }
                }
            } finally {
                if (isCurrentQuery) setLoading(false);
            }
        }, 300);

        return () => {
            isCurrentQuery = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    // --| Expose a way to manually clear results
    const clearResults = () => setResults([]);

    return { results, loading, clearResults };
};
