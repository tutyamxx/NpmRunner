/**
 * Extracts the GitHub repository path from a repository URL.
 *
 * Converts URLs like:
 * - git+https://github.com/user/repo.git -> user/repo
 * - https://github.com/user/repo -> user/repo
 *
 * @param   {string}      repoUrl - The full repository URL
 * @returns {string|null}         The GitHub "user/repo" string, or null if repoUrl is falsy
 */
export const getGithubRepo = (repoUrl) => {
    if (!repoUrl) {
        return null;
    }

    return repoUrl.replace(/^git\+/, '').replace(/\.git$/, '').replace('https://github.com/', '');
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
 * @param   {string} url  - The original URL (relative, blob, or absolute)
 * @param   {string} repo - The GitHub repo in any format (e.g., git+https://github.com/user/repo.git)
 * @returns {string}      The fixed URL suitable for direct browser access
 */
export const fixGithubUrl = (url, repo) => {
    if (!url) {
        return url;
    }

    const normalizedRepo = getGithubRepo(repo);

    if (/^https?:\/\//.test(url)) {
        return url.includes('/blob/')
            ? url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
            : url;
    }

    return normalizedRepo
        ? `https://raw.githubusercontent.com/${normalizedRepo}/main/${url.replace(/^\.?\//, '')}`
        : url;
};
