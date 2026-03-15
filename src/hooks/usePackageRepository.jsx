import { useState, useEffect } from 'react';
import { npmRegistry } from './useRunnerEffects';

/**
 * Fetches the repository URL for a given npm package.
 *
 * @param {string} currentPkg - Name of the npm package
 * @returns {string|null} repositoryUrl
 */
export const usePackageRepository = (currentPkg) => {
    const [repositoryUrl, setRepositoryUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;

        if (!currentPkg) {
            return;
        }

        const fetchRepository = async () => {
            try {
                const response = await fetch(`https://${npmRegistry}/${encodeURIComponent(currentPkg)}`);

                if (!response.ok) {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.error(`Failed to fetch package metadata for "${currentPkg}": ${response.status} ${response.statusText}`);
                    }

                    return;
                }

                const data = await response?.json();
                const repoUrl = (data?.repository?.url ?? data?.repository) || null;

                if (isMounted) {
                    setRepositoryUrl(repoUrl);
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.error('Error fetching package repository:', error);
                }
            }
        };

        fetchRepository();

        return () => {
            isMounted = false;
        };
    }, [currentPkg]);

    return repositoryUrl;
};
