/**
 * Extract only JS code blocks that contain at least one import statement
 * (ignores require() code blocks)
 *
 * @param {string} markdown - The README markdown
 * @returns {string[]} Array of JS code blocks containing imports
 */
export const extractJsImportCode = (markdown) => {
    const regex = /```(?:js|javascript)\s*([\s\S]*?)```/gi;
    const matches = [];

    let match;

    while ((match = regex?.exec(markdown ?? ''))) {
        const codeBlock = match?.[1]?.trim() ?? '';

        if (/import\s+.*\s+from\s+['"].*['"]/.test(codeBlock)) {
            matches?.push(codeBlock);
        }
    }

    return matches;
};
