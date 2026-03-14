/**
 * Extracts the GitHub repository path from a repository URL.
 *
 * Converts URLs like:
 * - git+https://github.com/user/repo.git -> user/repo
 * - https://github.com/user/repo -> user/repo
 *
 * @param {string} repoUrl - The full repository URL
 * @returns {string|null} The GitHub "user/repo" string, or null if repoUrl is falsy
 */
export const getGithubRepo = (repoUrl) => {
    if (!repoUrl) {
        return null;
    }

    return repoUrl?.replace(/^git\+/, '')?.replace(/\.git$/, '')?.replace('https://github.com/', '');
};

/**
 * Fixes GitHub URLs for use in markdown rendering.
 *
 * Handles:
 * - Converting relative paths to raw GitHub URLs
 * - Converting GitHub blob URLs to raw URLs
 * - Preserving non-GitHub absolute URLs as-is
 *
 * Examples:
 * - "./img/test.png" -> https://raw.githubusercontent.com/user/repo/main/img/test.png
 * - "https://github.com/user/repo/blob/main/file.js" -> https://raw.githubusercontent.com/user/repo/main/file.js
 * - "https://example.com/file.js" -> unchanged
 *
 * @param {string} url - The original URL (relative, blob, or absolute)
 * @param {string} repo - The GitHub repo in any format (e.g., git+https://github.com/user/repo.git)
 * @returns {string} The fixed URL suitable for direct browser access
 */
export const fixGithubUrl = (url, repo) => {
    if (!url) {
        return url;
    }

    // --| Normalize repository URL (git+https://github.com/user/repo.git -> user/repo)
    const normalizedRepo = getGithubRepo(repo);

    const isAbsolute = /^https?:\/\//.test(url);
    const isGithub = url?.includes('github.com');

    // --| Already absolute and not GitHub blob
    if (isAbsolute && !isGithub) {
        return url;
    }

    // --| Convert GitHub blob -> raw
    if (isGithub && url?.includes('/blob/')) {
        return url?.replace?.('github.com', 'raw.githubusercontent.com')?.replace?.('/blob/', '/');
    }

    // --| Convert relative paths (consolelog.png, ./img/test.png, etc.)
    if (!isAbsolute && normalizedRepo) {
        const clean = url?.replace(/^\.?\//, '');

        // --| Use main branch by default (GitHub standard)
        return `https://raw.githubusercontent.com/${normalizedRepo}/main/${clean}`;
    }

    return url;
};
