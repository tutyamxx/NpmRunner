/**
 * Build dynamic import lines for the runner iframe
 *
 * @param {string} code - Full user code
 * @returns {string} - JS snippet with all import statements
 */
export const buildImports = (code = '') => {
    const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
    const imports = [];

    let match;

    while ((match = importRegex?.exec(code))) {
        imports.push({ specifier: match?.[1] ?? '', packageName: match?.[2] ?? '' });
    }

    const transformedCode = code?.replace(importRegex, '');

    const importLines = imports?.map(({ packageName, specifier }) => {
        const trimmedSpecifier = specifier?.trim();
        const encodedPackage = encodeURIComponent(packageName);
        const safeSpecifierName = trimmedSpecifier?.replace(/\W/g, '_');

        const importWrapper = (varName) => `
            let ${varName};

            try {
                ${varName} = await import('https://cdn.skypack.dev/${encodedPackage}');
            } catch (err) {
                console.error('[Package Error]', '${packageName}', err.message || err, '⚠️ This package might be CommonJS or use Node-only APIs.');

                try {
                    ${varName} = await import('https://esm.sh/${encodedPackage}@latest?bundle');
                } catch (err2) {
                    console.error('[Package Error]', '${packageName}', err2.message || err2, '⚠️ This package might be CommonJS or use Node-only APIs.');
                    ${varName} = {};
                }
            }
        `;

        // --| Destructured imports
        if (trimmedSpecifier?.startsWith('{') && trimmedSpecifier?.endsWith('}')) {
            return `${importWrapper('skypackModule')}${specifier?.split(',')?.map(rawName => {
                const cleanName = rawName?.replace(/[{}]/g, '')?.trim();

                return `const ${cleanName} = skypackModule?.${cleanName};`;
            }).join('\n')}`;
        }

        // --| Default import
        return `
                ${importWrapper(`skypackModule_${safeSpecifierName}`)}
                const ${specifier} = skypackModule_${safeSpecifierName}.default ?? skypackModule_${safeSpecifierName};
        `;
    }).join('\n');

    return { importLines, transformedCode };
};
