import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../utils/extractJsImportCode', () => ({ extractJsImportCode: vi.fn() }));

import {
    useThemeEffect,
    getInitialTheme,
    useAutoHideNotification,
    getCircularReplacer,
    useIframeListener,
    useInitialCodeUpdate
} from './useRunnerEffects';

globalThis.fetch = vi.fn();

describe('🏖️ useRunnerEffects hooks', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.className = '';
        vi.clearAllMocks();
    });

    it('useThemeEffect sets body class and localStorage', () => {
        const { rerender } = renderHook(({ theme }) => useThemeEffect(theme), {
            initialProps: { theme: 'dark' }
        });

        expect(document.body.className).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');

        rerender({ theme: 'light' });
        expect(document.body.className).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('getInitialTheme returns stored theme or default', () => {
        expect(getInitialTheme()).toBe('dark');
        localStorage.setItem('theme', 'light');
        expect(getInitialTheme()).toBe('light');
    });

    it('getInitialTheme handles invalid localStorage values', () => {
        // eslint-disable-next-line no-undefined
        ['invalid-theme', null, undefined].forEach(val => {
            localStorage.setItem('theme', val);
            expect(getInitialTheme()).toBe('dark');
        });
    });

    vi.useFakeTimers();

    it('useAutoHideNotification clears notification after duration', () => {
        const setNotification = vi.fn();
        renderHook(() => useAutoHideNotification('Hi', setNotification, 500));

        expect(setNotification).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(500));
        expect(setNotification).toHaveBeenCalledWith('');
    });

    it('useAutoHideNotification does nothing when notification is empty', () => {
        const setNotification = vi.fn();

        renderHook(() => useAutoHideNotification('', setNotification, 500));
        expect(setNotification).not.toHaveBeenCalled();
    });

    it('getCircularReplacer handles circular objects', () => {
        const circular = {};
        circular.self = circular;

        const replacer = getCircularReplacer();
        const result = JSON.parse(JSON.stringify(circular, replacer));

        expect(result.self).toBe('[Circular]');
    });

    it('useInitialCodeUpdate sets code if empty', () => {
        const setCode = vi.fn();

        renderHook(() => useInitialCodeUpdate('console.log("hi")', '', setCode));
        expect(setCode).toHaveBeenCalledWith('console.log("hi")');
    });

    it('useInitialCodeUpdate does not set code if not empty', () => {
        const setCode = vi.fn();

        renderHook(() => useInitialCodeUpdate('console.log("hi")', 'existing code', setCode));
        expect(setCode).not.toHaveBeenCalled();
    });

    const dispatchMessage = data => act(() => window.dispatchEvent(new MessageEvent('message', { data })));

    const setupListener = () => {
        const setLogs = vi.fn();
        const setLoading = vi.fn();

        renderHook(() => useIframeListener(setLogs, setLoading));

        return { setLogs, setLoading };
    };

    it('useIframeListener handles log, done, error, null, undefined and circular args', () => {
        const { setLogs, setLoading } = setupListener();

        // --| Log message
        dispatchMessage({ type: 'log', args: ['hello'] });
        expect(setLogs).toHaveBeenCalled();

        // --| Done message
        dispatchMessage({ type: 'done' });
        expect(setLoading).toHaveBeenCalledWith(false);

        // --| Error message
        dispatchMessage({ type: 'error', args: ['error occurred'] });
        expect(setLogs).toHaveBeenCalled();

        // --| Malformed data
        dispatchMessage(null);
        dispatchMessage({});
        // eslint-disable-next-line no-undefined
        dispatchMessage({ type: 'log', args: [null, undefined] });

        // --| Object with circular reference
        const circular = {};
        circular.self = circular;

        dispatchMessage({ type: 'log', args: [circular] });

        const circularResult = setLogs.mock.calls.at(-1)[0]([]);
        expect(circularResult[0].text).toContain('[Circular]');

        // --| Object with broken toJSON
        const badObj = { toJSON() {
            throw new Error('Cannot stringify');
        } };

        dispatchMessage({ type: 'log', args: [badObj] });

        const fallbackResult = setLogs.mock.calls.at(-1)[0]([]);
        expect(fallbackResult[0].text).toBe('[object Object]');
    });

    it('useIframeListener formats object args safely', () => {
        const { setLogs } = setupListener();
        dispatchMessage({ type: 'log', args: [{ a: 1, b: 2 }] });

        const updater = setLogs.mock.calls[0][0];
        const result = updater([]);
        expect(result[0].text).toContain('"a": 1');
    });
});
