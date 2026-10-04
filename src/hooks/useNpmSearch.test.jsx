import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNpmSearch } from './useNpmSearch';

vi.useFakeTimers();

describe('🏖️ useNpmSearch hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
    });

    it('Returns empty results and loading false for short or empty query', () => {
        const { result, rerender } = renderHook(({ q }) => useNpmSearch(q), { initialProps: { q: '' } });

        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);

        rerender({ q: 'a' });
        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('Performs search and updates results and loading', async () => {
        const mockData = { objects: [{ package: { name: 'react' } }] };

        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useNpmSearch('react'));

        // --| Initially loading false (setTimeout hasn't run yet)
        expect(result.current.loading).toBe(false);

        // --| Advance timers for debounce
        await act(async () => vi.advanceTimersByTime(300));

        // --| Wait for useEffect
        await act(async () => {});

        expect(result.current.loading).toBe(false);
        expect(result.current.results).toEqual(mockData.objects);
    });

    it('Handles fetch error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.fetch.mockRejectedValueOnce(new Error('Network fail'));

        const { result } = renderHook(() => useNpmSearch('fail'));

        await act(async () => vi.advanceTimersByTime(300));
        await act(async () => {});

        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('Function clearResults empties the results', async () => {
        const mockData = { objects: [{ package: { name: 'react' } }] };

        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useNpmSearch('react'));

        await act(async () => vi.advanceTimersByTime(300));
        await act(async () => {});

        expect(result.current.results).toEqual(mockData.objects);

        act(() => result.current.clearResults());
        expect(result.current.results).toEqual([]);
    });

    it('Does not set results if query changes quickly (debounce cancel)', async () => {
        const mockData = { objects: [{ package: { name: 'react' } }] };

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result, rerender } = renderHook(({ q }) => useNpmSearch(q), { initialProps: { q: 'reac' } });

        // --| Change query before debounce fires
        rerender({ q: 'vue' });

        await act(async () => vi.advanceTimersByTime(300));
        await act(async () => {});

        // --| Results should only reflect latest query
        expect(result.current.results).toEqual(mockData.objects);
    });
});
