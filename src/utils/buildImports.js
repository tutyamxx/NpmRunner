/**
 * Build dynamic import lines for the runner iframe
 *
 * @param {string} code - Full user code
 * @returns {string} - JS snippet with all import statements
 */
export const buildImports = (code = '') => {
    const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
    const requireRegex = /const\s+(\w+)\s*=\s*require\(['"](.*?)['"]\)/g;

    const imports = [];

    // --| Extract ESM import statements
    for (const match of code.matchAll(importRegex)) {
        imports?.push({ specifier: match?.[1], packageName: match?.[2] });
    }

    // --| Extract require statements as default imports
    for (const match of code.matchAll(requireRegex)) {
        imports?.push({ specifier: match?.[1], packageName: match?.[2] });
    }

    // --| Remove original import/require statements from user code
    const transformedCode = code?.replace(importRegex, '')?.replace(requireRegex, '');

    const importLines = imports.map(({ packageName, specifier }) => {
        const trimmedSpecifier = specifier?.trim();
        const encodedPackage = encodeURIComponent(packageName);
        const safeSpecifierName = trimmedSpecifier?.replace(/\W/g, '_');

        const importWrapper = (varName) => `

            let ${varName};

            try {
                ${varName} = await import('https://cdn.skypack.dev/${encodedPackage}');
            } catch (err) {
                console.error('[Package Error]', '${packageName}', err.message || err, '⚠️ Might be CommonJS or Node-only.');
                try {
                    ${varName} = await import('https://esm.sh/${encodedPackage}@latest?bundle');
                } catch (err2) {
                    console.error('[Package Error]', '${packageName}', err2.message || err2, '⚠️ Failed to load.');
                    ${varName} = {};
                }
            }
        `;

        // --| Destructured imports
        if (trimmedSpecifier?.startsWith('{') && trimmedSpecifier?.endsWith('}')) {
            return `
                ${importWrapper('skypackModule')}
                const { ${trimmedSpecifier?.replace(/[{}]/g, '')} } = skypackModule?.default ?? skypackModule ?? {};
            `;
        }

        // --| Default import / require import
        return `
            ${importWrapper(`skypackModule_${safeSpecifierName}`)}
            const ${trimmedSpecifier} = skypackModule_${safeSpecifierName}.default ?? skypackModule_${safeSpecifierName} ?? {};
        `;
    })?.join('\n');

    return { importLines, transformedCode };
};
