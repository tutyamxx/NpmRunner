/**
 * Safely encodes an npm package name for CDN import URLs, with support for scoped packages.
 *
 * Behavior:
 * - **Unscoped packages**: the entire package specifier is URL-encoded.
 *   e.g., `my pkg` → `my%20pkg`
 * - **Scoped packages** (`@scope/pkg`): the `@scope/` segment is preserved as-is,
 *   the package name is URL-encoded, and any additional subpaths are preserved literally.
 * - **Subpaths**: any segments after the package name are not encoded and remain unchanged.
 *
 * Examples:
 *   "lodash" → "lodash"
 *   "@types/node" → "@types/node"
 *   "@scope/pkg/sub/path" → "@scope/pkg/sub/path"
 *   "@scope/pkg/a b" → "@scope/pkg/a b"  // package name encoded if contains special chars
 *
 * @param {string} pkg - The raw npm package specifier (may be scoped and/or include subpaths).
 * @returns {string} A CDN-safe package path string suitable for import URLs.
 */
const encodeScopedPackage = (pkg = '') => {
    // --| If it's not scoped, just encode the whole thing (standard behavior)
    if (!pkg?.startsWith('@')) {
        return encodeURIComponent(pkg);
    }

    // --| Scoped package logic: @scope/pkg-name/sub-path
    const parts = pkg?.split('/');

    // --| parts[0] is the @scope
    // --| parts[1] is the package name (this is what usually needs encoding)
    // --| parts[2+] are subpaths
    const scope = parts?.[0];
    const pkgName = parts?.[1] ? encodeURIComponent(parts?.[1]) : '';
    const rest = parts?.slice(2)?.join('/');

    let result = `${scope}/${pkgName}`;

    if (rest) {
        result += `/${rest}`;
    }

    return result;
};

/**
 * Build dynamic import lines for the runner iframe
 *
 * @param {string} code - Full user code
 * @returns {string} - JS snippet with all import statements
 */
export const buildImports = (code = '') => {
    // --| Safely default null/undefined code
    code = code ?? '';

    // --| Regexes for ESM imports and require statements
    const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
    const requireRegex = /\b(const|let|var)\s+([A-Za-z_$][\w$]*|\{[^}]+\})\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;

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

    // --| Transform remaining inline require() calls into dynamic imports
    transformedCode = transformedCode.replace(
        /require\(['"](.*?)['"]\)/g,

        (_, pkgName) => {
            const safePkg = encodeScopedPackage(pkgName);
            const url = `https://esm.sh/${safePkg}@latest?bundle`;

            return `(await import('${url}'))?.default ?? (await import('${url}'))`;
        }
    );

    // --| Wrapper to try multiple CDNs for a package
    const importWrapper = (varName, pkg) => `
        let ${varName};

        try {
            // --| Try esm.sh first — generally better for scoped packages
            ${varName} = await import('https://esm.sh/${encodeScopedPackage(pkg)}?bundle&target=es2022');
        } catch (err) {
            try {
                // --| Fallback to Skypack only if esm.sh fails
                ${varName} = await import('https://cdn.skypack.dev/${encodeScopedPackage(pkg)}');
            } catch (err2) {
                console.error('[Package Error]', '${pkg}', err2?.message ?? err2, '⚠️ Failed to run script. It might be expecting a node runtime.');
                ${varName} = {};
            }
        }
    `;

    // --| Generate import lines dynamically, handling default + named + destructured imports
    const importLines = imports?.map(({ packageName, specifier }) => {
        const trimmedSpecifier = specifier?.trim();
        const safeVar = trimmedSpecifier?.replace(/\W/g, '_');

        // --| Destructured imports
        if (trimmedSpecifier?.startsWith('{') && trimmedSpecifier?.endsWith('}')) {
            const names = trimmedSpecifier?.replace(/[{}]/g, '')?.trim();

            return `
                ${importWrapper('skypackModule', packageName)}
                const { ${names} } = skypackModule?.default ?? skypackModule ?? {};
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
