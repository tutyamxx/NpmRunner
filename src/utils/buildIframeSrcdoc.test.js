import { buildIframeSrcdoc } from './buildIframeSrcdoc';

describe('🏖️ buildIframeSrcdoc', () => {
    let importLines;
    let transformedCode;
    let result;

    const mockOrigin = 'http://localhost';

    beforeEach(() => {
        importLines = '';
        transformedCode = '';
        result = '';
        globalThis.window = { location: { origin: mockOrigin } };
    });

    it('Returns a valid HTML document string', () => {
        result = buildIframeSrcdoc('', '');

        expect(typeof result).toBe('string');
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<script type="module">');
        expect(result).toContain('</html>');
    });

    it('Injects the circular replacer and safeStringify helper', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('const replacer = (');
        expect(result).toContain('const safeStringify');
        expect(result).toContain('JSON.stringify');
    });

    it('Overrides console methods using a loop and posts messages to parent', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('[\'log\', \'error\', \'warn\', \'info\'].forEach');
        expect(result).toContain('console[level] = (...args)');
        expect(result).toContain('sandboxEmit(level, args)');
    });

    it('Secures postMessage with the current origin instead of "*"', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain(mockOrigin);
        expect(result).not.toContain('\'*\'');
    });

    it('Injects importLines before executing user code', () => {
        importLines = 'const React = await import(\'react\');';
        result = buildIframeSrcdoc(importLines, '');

        expect(result).toContain(importLines);
    });

    it('Injects transformed user code into the execution block', () => {
        transformedCode = `
            console.log('hello world');
            const x = 42;
        `;
        result = buildIframeSrcdoc('', transformedCode);

        expect(result).toContain('console.log(\'hello world\')');
        expect(result).toContain('const x = 42');
    });

    it('Wraps user code in try/catch and reports runtime errors', () => {
        result = buildIframeSrcdoc('', 'throw new Error("boom")');

        expect(result).toContain('try {');
        expect(result).toContain('catch (e)');
        expect(result).toContain('sandboxEmit(\'error\', [e])');
    });

    it('Handles global errors and promise rejections', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('window.onerror');
        expect(result).toContain('window.onunhandledrejection');
        expect(result).toContain('sandboxEmit(\'error\', [error ?? msg])');
    });

    it('Notifies parent when execution is done with specific origin', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain(`parent.postMessage({ type: 'done' }, '${mockOrigin}')`);
    });

    it('Handles null or undefined transformedCode safely', () => {
        result = buildIframeSrcdoc('', null);

        expect(result).toContain('try {');
        expect(result).toContain('catch (e)');
        expect(result).toContain(`parent.postMessage({ type: 'done' }, '${mockOrigin}')`);
    });

    it('Uses safeStringify for object arguments in console logs', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('typeof arg === \'object\'');
        expect(result).toContain('safeStringify(arg)');
    });

    it('Provides specific Error object serialization with message', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('obj instanceof Error');
        expect(result).toContain('message: obj.message');
    });

    it('Does not inline raw require or import statements in transformed code', () => {
        transformedCode = `
            import React from 'react';
            const fs = require('fs');
        `;

        result = buildIframeSrcdoc('', transformedCode);

        expect(result).toContain('import React from \'react\'');
        expect(result).toContain('require(\'fs\')');
    });

    it('Always wraps execution in an async IIFE', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('(async () => {');
        expect(result).toContain('})();');
    });

    it('Does not omit the finally block even with empty user code', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('} finally {');
        expect(result).toContain(`parent.postMessage({ type: 'done' }, '${mockOrigin}')`);
    });

    it('Generates a single script tag with type="module"', () => {
        result = buildIframeSrcdoc('', '');

        const matches = result.match(/<script type="module">/g) || [];
        expect(matches.length).toBe(1);
    });

    it('Handles unserializable objects gracefully', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('catch (e)');
        expect(result).toContain('"[Unserializable Object]"');
    });
});
