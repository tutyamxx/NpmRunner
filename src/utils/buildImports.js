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
        imports.push({ specifier: match?.[1]?.trim(), packageName: match?.[2] });
    }

    // --| Extract require statements as default or destructured imports
    for (const match of code.matchAll(requireRegex)) {
        imports.push({ specifier: match?.[2]?.trim(), packageName: match?.[3] });
    }

    // --| Remove original import/require statements
    let transformedCode = code.replace(importRegex, '').replace(requireRegex, '');

    // --| Transform remaining inline require() calls into dynamic imports
    transformedCode = transformedCode.replace(
        /require\(['"](.*?)['"]\)/g,
        (_, pkg) => `await import('https://esm.sh/${encodeScopedPackage(pkg)}?bundle')`
    );

    // --| Generate parallel import lines with Promise.any but keep try/catch logs
    const importLines = imports.map(({ specifier, packageName }) => {
        if (!specifier) {
            return '';
        }

        const safeVar = specifier?.replace(/\W/g, '_');
        const isDestructured = specifier?.startsWith('{') && specifier?.endsWith('}');

        const wrapper = `
            let skypack_${safeVar};

            try {
                // --| Try esm.sh and Skypack in parallel for speed
                skypack_${safeVar} = await Promise.any([
                    import('https://esm.sh/${encodeScopedPackage(packageName)}?bundle&target=es2022'),
                    import('https://cdn.skypack.dev/${encodeScopedPackage(packageName)}')
                ]);
            } catch (err) {
                console.error(
                    '[Package Error]',
                    '${packageName}',
                    '⚠️ Failed to run script. It might be expecting a node runtime.'
                );

                if (err?.errors) {
                    for (const e of err.errors) {
                        console.error(e?.message ?? e?.code ?? e);
                    }
                }

                skypack_${safeVar} = {};
            }
        `;

        // --| Destructured imports
        if (isDestructured) {
            const names = specifier.replace(/[{}]/g, '')?.trim();

            return `${wrapper}\nconst { ${names} } = skypack_${safeVar}?.default ?? skypack_${safeVar} ?? {};`;
        }

        // --| Default import / require import
        const validIdentifier = /^[A-Za-z_$][\w$]*$/.test(specifier);
        if (!validIdentifier) {
            return `${wrapper}\n// ⚠️ Skipped invalid variable name: ${specifier}`;
        }

        return `${wrapper}\nconst ${specifier} = skypack_${safeVar}?.default ?? skypack_${safeVar} ?? {};`;
    }).join('\n');

    return { importLines, transformedCode };
};
