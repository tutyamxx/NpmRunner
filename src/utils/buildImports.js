/**
 * Build dynamic import lines for the runner iframe
 *
 * @param {string} code - Full user code
 * @returns {string} - JS snippet with all import statements
 */
export const buildImports = (code = '') => {
    // --| Regexes for ESM imports and require statements
    const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
    const requireRegex = /(const|let|var)\s+(\{?.*?\}?)\s*=\s*require\(['"](.*?)['"]\)/g;

    const imports = [];

    // --| Extract ESM import statements
    for (const match of code.matchAll(importRegex)) {
        imports?.push({ specifier: match?.[1], packageName: match?.[2] });
    }

    // --| Extract require statements as default or destructured imports
    for (const match of code.matchAll(requireRegex)) {
        imports?.push({ specifier: match?.[2], packageName: match?.[3] });
    }

    // --| Remove original import/require statements
    let transformedCode = code?.replace(importRegex, '')?.replace(requireRegex, '');

    // --| Transform remaining inline require() calls
    transformedCode = transformedCode?.replace(/require\(['"](.*?)['"]\)/g, (_, pkgName) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        `(await import('https://esm.sh/${encodeURIComponent(pkgName)}@latest?bundle'))?.default \
        ?? (await import('https://esm.sh/${encodeURIComponent(pkgName)}@latest?bundle'))`
    );

    // --| Wrapper to try multiple CDNs for a package
    const importWrapper = (varName, pkg) => `
        let ${varName};

        try {
            ${varName} = await import('https://cdn.skypack.dev/${encodeURIComponent(pkg)}');
        } catch (err) {
            console.error('[Package Error]', '${pkg}', err?.message ?? err, '⚠️ Might be expecting a Node runtime.');

            try {
                ${varName} = await import('https://esm.sh/${encodeURIComponent(pkg)}@latest?bundle');
            } catch (err2) {
                console.error('[Package Error]', '${pkg}', err2?.message ?? err2, '⚠️ Failed to load.');
                ${varName} = {};
            }
        }
    `;

    // --| Generate import lines
    const importLines = imports?.map(({ packageName, specifier }) => {
        const trimmedSpecifier = specifier?.trim();
        const safeVar = trimmedSpecifier?.replace(/\W/g, '_');

        // --| Destructured imports
        if (trimmedSpecifier?.startsWith('{') && trimmedSpecifier?.endsWith('}')) {
            return `
                ${importWrapper('skypackModule', packageName)}
                const { ${trimmedSpecifier?.replace(/[{}]/g, '')} } = skypackModule?.default ?? skypackModule ?? {};
            `;
        }

        // --| Default import / require import
        return `
            ${importWrapper(`skypackModule_${safeVar}`, packageName)}
            const ${trimmedSpecifier} = skypackModule_${safeVar}?.default ?? skypackModule_${safeVar} ?? {};
        `;
    })?.join('\n');

    return { importLines, transformedCode };
};
