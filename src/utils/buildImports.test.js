import { buildImports } from './buildImports';

describe('🏖️ buildImports', () => {
    let code;

    beforeEach(() => code = '');

    it('Returns empty importLines and unchanged transformedCode for empty code', () => {
        const { importLines, transformedCode } = buildImports('');

        expect(importLines).toBe('');
        expect(transformedCode).toBe('');
    });

    it('Extracts simple ESM import statements', () => {
        code = `
            import React from 'react';
            import { useState } from 'react';
            console.log('hello');
        `;

        const { importLines, transformedCode } = buildImports(code);

        expect(importLines).toContain('React');
        expect(importLines).toContain('useState');
        expect(transformedCode).toContain('console.log');
        expect(transformedCode).not.toContain('import React');
        expect(transformedCode).not.toContain('import { useState }');
    });

    it('Extracts simple require statements', () => {
        code = `
            const fs = require('fs');
            let path = require("path");
        `;

        const { importLines, transformedCode } = buildImports(code);

        expect(importLines).toContain('fs');
        expect(importLines).toContain('path');
        expect(transformedCode).not.toContain('require');
    });

    it('Transforms inline require() calls', () => {
        code = `
            const fs = require('fs');
            console.log(require('path'));
        `;

        const { transformedCode } = buildImports(code);

        expect(transformedCode).toContain('await import');
        expect(transformedCode).not.toContain('require(');
    });

    it('Handles destructured require statements', () => {
        code = `
            const { readFile, writeFile } = require('fs');
        `;

        const { importLines, transformedCode } = buildImports(code);

        // --| Use regex to ignore whitespace differences
        expect(importLines).toMatch(/\{\s*readFile,\s*writeFile\s*\}/);
        expect(transformedCode).not.toContain('require(');
    });

    it('Maintains other code intact', () => {
        code = `
            console.log('hello world');
            const x = 123;
        `;

        const { transformedCode } = buildImports(code);

        expect(transformedCode).toContain('console.log');
        expect(transformedCode).toContain('const x = 123');
    });

    it('Handles combination of imports and requires', () => {
        code = `
            import React from 'react';
            const fs = require('fs');
            console.log('mixed');
        `;

        const { importLines, transformedCode } = buildImports(code);

        expect(importLines).toContain('React');
        expect(importLines).toContain('fs');
        expect(transformedCode).toContain('console.log');
        expect(transformedCode).not.toContain('import React');
        expect(transformedCode).not.toContain('require');
    });

    it('Safely handles null or undefined code', () => {
        expect(buildImports(null).importLines).toBe('');
        expect(buildImports(null).transformedCode).toBe('');

        // eslint-disable-next-line no-undefined
        expect(buildImports(undefined).importLines).toBe('');
        // eslint-disable-next-line no-undefined
        expect(buildImports(undefined).transformedCode).toBe('');
    });

    it('Generates importWrapper code with CDN fallback (error only after both fail)', () => {
        code = `
            import _ from 'lodash';
        `;

        const { importLines } = buildImports(code);

        expect(importLines).toContain('https://esm.sh');
        expect(importLines).toContain('https://cdn.skypack.dev');

        const errorMatches = importLines.match(/console\.error/g) || [];
        expect(errorMatches.length).toBe(2);
    });

    it('Encodes scoped packages correctly', () => {
        code = `
            import qrcode from '@slidoapp/qrcode';
            import { QueryClient } from '@tanstack/query-core';
        `;

        const { importLines, transformedCode } = buildImports(code);

        // --| Check scoped package names preserved in URL
        expect(importLines).toContain('@slidoapp/qrcode');
        expect(importLines).toContain('@tanstack/query-core');

        // --| Ensure transformed code does not have original import lines
        expect(transformedCode).not.toContain('import qrcode');
        expect(transformedCode).not.toContain('import { QueryClient }');
    });
});
