import { buildIframeSrcdoc } from './buildIframeSrcdoc';

describe('buildIframeSrcdoc', () => {
    let importLines;
    let transformedCode;
    let result;

    beforeEach(() => {
        importLines = '';
        transformedCode = '';
        result = '';
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
        expect(result).toContain('function safeStringify');
        expect(result).toContain('JSON.stringify');
    });

    it('Overrides console.log and posts messages to parent', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('console.log = (...args)');
        expect(result).toContain('parent.postMessage({ type: \'log\'');
    });

    it('Overrides console.error and posts messages to parent', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('console.error = (...args)');
        expect(result).toContain('parent.postMessage({ type: \'error\'');
    });

    it('Injects importLines before executing user code', () => {
        importLines = `
            const React = await import('react');
        `;

        result = buildIframeSrcdoc(importLines, '');

        expect(result).toContain(importLines.trim());
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
        expect(result).toContain('parent.postMessage({ type: \'error\'');
    });

    it('Notifies parent when execution is done', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('parent.postMessage({ type: \'done\' }, \'*\')');
    });

    it('Handles null or undefined transformedCode safely', () => {
        result = buildIframeSrcdoc('', null);

        expect(result).toContain('try {');
        expect(result).toContain('} catch (e)');
        expect(result).toContain('parent.postMessage({ type: \'done\' }, \'*\')');
    });

    it('Preserves line indentation when injecting transformed code', () => {
        transformedCode = `
            console.log('a');
            console.log('b');
        `.trim();

        result = buildIframeSrcdoc('', transformedCode);

        // --| Expect injected lines to be indented inside the try block
        expect(result).toMatch(/try\s*\{\s*console\.log\('a'\);/s);
        expect(result).toMatch(/console\.log\('b'\);/);
    });

    it('Places importLines before the try/catch execution block', () => {
        importLines = `
            const React = await import('react');
        `;

        result = buildIframeSrcdoc(importLines, 'console.log("hi")');

        const importIndex = result.indexOf(importLines.trim());
        const tryIndex = result.indexOf('try {');

        expect(importIndex).toBeGreaterThan(-1);
        expect(tryIndex).toBeGreaterThan(-1);
        expect(importIndex).toBeLessThan(tryIndex);
    });

    it('Ensures console overrides happen before user code execution', () => {
        result = buildIframeSrcdoc('', 'console.log("hi")');

        const overrideIndex = result.indexOf('console.log = (...args)');
        const tryIndex = result.indexOf('try {');

        expect(overrideIndex).toBeGreaterThan(-1);
        expect(tryIndex).toBeGreaterThan(-1);
        expect(overrideIndex).toBeLessThan(tryIndex);
    });

    it('Uses safeStringify for object arguments in console.log', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('typeof arg === \'object\'');
        expect(result).toContain('? safeStringify(arg)');
    });

    it('Uses safeStringify for object arguments in console.error', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('console.error = (...args)');
        expect(result).toContain('? safeStringify(arg)');
    });

    it('Does not inline raw require or import statements in transformed code', () => {
        transformedCode = `
            import React from 'react';
            const fs = require('fs');
        `;

        result = buildIframeSrcdoc('', transformedCode);

        expect(result).toContain('try {');
        expect(result).toContain('import React from \'react\'');
        expect(result).toContain('require(\'fs\')');
    });

    it('Always wraps execution in an async IIFE', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('(async () => {');
        expect(result).toContain('})();');
    });

    it('Defines console.log and console.error originals before overriding', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('const log = console.log;');
        expect(result).toContain('const error = console.error;');
    });

    it('Posts execution errors using error message fallback', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('e?.message || String(e)');
    });

    it('Does not omit the finally block even with empty user code', () => {
        result = buildIframeSrcdoc('', '');

        expect(result).toContain('} finally {');
        expect(result).toContain('parent.postMessage({ type: \'done\' }, \'*\')');
    });

    it('Generates a single script tag with type="module"', () => {
        result = buildIframeSrcdoc('', '');

        const matches = result.match(/<script type="module">/g) || [];

        expect(matches.length).toBe(1);
    });
});
