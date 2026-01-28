import { extractJsImportCode } from './extractJsImportCode';

describe('extractJsImportCode', () => {
    let markdown;

    it('Returns empty array when markdown has no JS code blocks', () => {
        markdown = `
            # Title

            Some text here.

            \`\`\`html
            <div>Hello</div>
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toEqual([]);
    });

    it('Extracts JS code blocks with ES module imports', () => {
        markdown = `
            \`\`\`js
            import React from 'react';
            console.log(React);
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toContain('import React from \'react\'');
    });

    it('Prioritizes import blocks over require blocks', () => {
        markdown = `
            \`\`\`js
            const fs = require('fs');
            \`\`\`

            \`\`\`javascript
            import path from 'path';
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toHaveLength(2);
        expect(result[0]).toContain('import path from \'path\'');
        expect(result[1]).toContain('require(\'fs\')');
    });

    it('Returns require blocks if no import blocks exist', () => {
        markdown = `
            \`\`\`js
            const fs = require('fs');
            \`\`\`

            \`\`\`javascript
            const path = require("path");
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toHaveLength(2);
        expect(result[0]).toContain('require(\'fs\')');
        expect(result[1]).toContain('require("path")');
    });

    it('Ignores JS code blocks without import or require', () => {
        markdown = `
            \`\`\`js
            console.log('hello world');
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toEqual([]);
    });

    it('Handles mixed JS and non-JS code blocks', () => {
        markdown = `
            \`\`\`js
            import lodash from 'lodash';
            \`\`\`

            \`\`\`python
            import os
            \`\`\`

            \`\`\`javascript
            const fs = require('fs');
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toHaveLength(2);
        expect(result[0]).toContain('import lodash from \'lodash\'');
        expect(result[1]).toContain('require(\'fs\')');
    });

    it('Trims extracted code blocks', () => {
        markdown = `
            \`\`\`js

                import x from 'y';

            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result[0].startsWith('import')).toBe(true);
        expect(result[0].endsWith(';')).toBe(true);
    });

    it('Handles null or undefined markdown safely', () => {
        expect(extractJsImportCode(null)).toEqual([]);
        // eslint-disable-next-line no-undefined
        expect(extractJsImportCode(undefined)).toEqual([]);
    });

    it('Extracts multiple import blocks in order of appearance', () => {
        markdown = `
            \`\`\`js
            import a from 'a';
            \`\`\`

            \`\`\`javascript
            import b from 'b';
            \`\`\`
        `;

        const result = extractJsImportCode(markdown);

        expect(result).toEqual(['import a from \'a\';', 'import b from \'b\';']);
    });
});
