/**
 * Extract JavaScript code blocks that contain either:
 *  - at least one ES module `import` statement (priority)
 *  - or, if no imports exist in any block, CommonJS `require('package')` statements
 *
 * @param {string} markdown - The README markdown
 * @returns {string[]} Array of JS code blocks containing imports first, then requires
 */
export const extractJsImportCode = (markdown) => {
    const regex = /```(?:js|javascript)\s*([\s\S]*?)```/gi;

    const importBlocks = [];
    const requireBlocks = [];

    let match;

    while ((match = regex?.exec(markdown ?? ''))) {
        const codeBlock = match?.[1]?.trim() ?? '';

        const hasImport = /import\s+.*\s+from\s+['"].*['"]/.test(codeBlock);
        const hasRequire = /require\s*\(\s*['"].*['"]\s*\)/.test(codeBlock);

        if (hasImport) {
            importBlocks.push(codeBlock);
        } else if (hasRequire) {
            requireBlocks.push(codeBlock);
        }
    }

    // --| Return imports first, then requires
    return [...importBlocks, ...requireBlocks];
};
