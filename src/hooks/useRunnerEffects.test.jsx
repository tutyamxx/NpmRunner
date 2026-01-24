import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
    useThemeEffect,
    getInitialTheme,
    useAutoHideNotification,
    getCircularReplacer,
    useIframeListener,
    useInitialCodeUpdate
} from './useRunnerEffects';

vi.mock('../utils/extractJsImportCode', () => ({
    extractJsImportCode: vi.fn((readme) => {
        if (readme.includes('import')) return ['import mod from "pkg";'];

        return [];
    })
}));

describe('useRunnerEffects hooks', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.className = '';
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
        expect(getInitialTheme()).toBe('dark'); // Default
        localStorage.setItem('theme', 'light');
        expect(getInitialTheme()).toBe('light');
    });

    vi.useFakeTimers();

    it('useAutoHideNotification clears notification after duration', () => {
        const notification = 'Hi';
        const setNotification = vi.fn();

        renderHook(() => useAutoHideNotification(notification, setNotification, 500));
        expect(setNotification).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(500));
        expect(setNotification).toHaveBeenCalledWith('');
    });

    it('getCircularReplacer handles circular objects', () => {
        const circularObj = {};
        circularObj.self = circularObj;

        const replacer = getCircularReplacer();
        const result = JSON.parse(JSON.stringify(circularObj, replacer));

        expect(result.self).toBe('[Circular]');
    });

    it('useInitialCodeUpdate sets code if empty', () => {
        const code = '';
        const setCode = vi.fn();

        renderHook(() => useInitialCodeUpdate('console.log("hi")', code, setCode));
        expect(setCode).toHaveBeenCalledWith('console.log("hi")');
    });

    it('useIframeListener handles log and done messages', () => {
        const setLogs = vi.fn();
        const setLoading = vi.fn();

        renderHook(() => useIframeListener(setLogs, setLoading));

        act(() => {
            window.dispatchEvent(
                new MessageEvent('message', {
                    data: { type: 'log', args: ['hello'] }
                })
            );
        });
        expect(setLogs).toHaveBeenCalled();

        act(() => window.dispatchEvent(new MessageEvent('message', { data: { type: 'done' } })));
        expect(setLoading).toHaveBeenCalledWith(false);
    });
});
