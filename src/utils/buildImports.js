const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const IMPORT_REGEX = /\bimport\s+([^;'"]+?)\s+from\s+['"]([^'"]+)['"]/g;
const REQUIRE_REGEX = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*|\{[^}]+\})\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
const INLINE_REQUIRE_REGEX = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Encodes each segment of an npm specifier for use in a CDN URL.
 * Scopes (`@scope`), versions (`pkg@1.2.3`) and subpaths (`pkg/sub`) are preserved.
 *
 * "lodash/fp"      → "lodash/fp"
 * "@scope/pkg/a b" → "@scope/pkg/a%20b"
 *
 * @param   {string} pkg - The raw npm package specifier.
 * @returns {string}     A CDN-safe package path.
 */
const encodeScopedPackage = (pkg = '') => pkg.split('/').map((segment) => encodeURIComponent(segment).replace(/%40/g, '@')).join('/');

/**
 * Runtime helper injected once into the iframe (instead of one try/catch block per import).
 * `__load` races esm.sh and Skypack and returns `{}` if both fail.
 */
const LOADER = `
    const __load = async (pkg) => {
        try {
            return await Promise.any([
                import('https://esm.sh/' + pkg + '?bundle&target=es2022'),
                import('https://cdn.skypack.dev/' + pkg)
            ]);
        } catch (err) {
            console.error('[Package Error]', pkg, '⚠️ Failed to run script. It might be expecting a node runtime.');

            for (const e of err?.errors ?? []) {
                console.error(e?.message ?? e?.code ?? e);
            }

            return {};
        }
    };
`;

/**
 * Converts an import/require specifier into variable declarations.
 * Handles `Default`, `{ a, b as c }`, `* as ns` and `Default, { a }`.
 *
 * @param   {string}   specifier - The part between `import` and `from` (or the require binding).
 * @param   {string}   ref       - The variable holding the loaded module.
 * @returns {string[]}           Declaration lines.
 */
const buildDeclarations = (specifier, ref) => {
    const named = specifier.match(/\{([^}]*)\}/)?.[1]?.trim();
    const head = specifier.replace(/\{[^}]*\}/, '').replace(/^\s*,|,\s*$/g, '').trim();
    const namespace = head.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/)?.[1];

    const lines = [];

    if (namespace) {
        lines.push(`const ${namespace} = ${ref};`);
    } else if (IDENTIFIER.test(head)) {
        lines.push(`const ${head} = ${ref}?.default ?? ${ref};`);
    } else if (head) {
        lines.push(`// --| ⚠️ Skipped invalid variable name: ${head}`);
    }

    // --| `a as b` is import syntax, destructuring needs `a: b`
    if (named) {
        lines.push(`const { ${named.replace(/\s+as\s+/g, ': ')} } = ${ref}?.default ?? ${ref};`);
    }

    return lines;
};

/**
 * Builds dynamic import lines for the runner iframe.
 *
 * @param   {string}                                           code - Full user code.
 * @returns {{ importLines: string, transformedCode: string }}      Import snippet and the user code with imports/requires rewritten.
 */
export const buildImports = (code = '') => {
    const source = code ?? '';

    const toEntry = ([, specifier, pkg]) => ({ specifier: specifier.trim(), pkg });
    const imports = [...source.matchAll(IMPORT_REGEX), ...source.matchAll(REQUIRE_REGEX)].map(toEntry);

    const transformedCode = source
        .replace(IMPORT_REGEX, '')
        .replace(REQUIRE_REGEX, '')
        .replace(INLINE_REQUIRE_REGEX, (_, pkg) => `await import('https://esm.sh/${encodeScopedPackage(pkg)}?bundle')`);

    const declarations = imports.flatMap(({ specifier, pkg }, i) => [
        `const __m${i} = await __load(${JSON.stringify(encodeScopedPackage(pkg))});`,
        ...buildDeclarations(specifier, `__m${i}`)
    ]);

    const importLines = declarations.length ? `${LOADER}\n${declarations.join('\n')}` : '';

    return { importLines, transformedCode };
};
