import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePackageRepository } from './usePackageRepository';
import { npmRegistry } from './useRunnerEffects';

describe('🏖️ usePackageRepository hook', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        globalThis.fetch = vi.fn();
    });

    it('Returns null if currentPkg is empty', () => {
        const { result } = renderHook(() => usePackageRepository(''));

        expect(result.current).toBeNull();
    });

    it('Fetches repository URL successfully', async () => {
        const mockData = { repository: { url: 'https://github.com/tutyamxx/contains-emoji' } };

        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => usePackageRepository('react'));

        // --| Wait specifically for the value to change from null
        await waitFor(() => expect(result.current).toBe(mockData.repository.url));

        expect(globalThis.fetch).toHaveBeenCalledWith(`https://${npmRegistry}/react`);
    });

    it('Handles repository as string', async () => {
        const mockData = { repository: 'https://github.com/some/package' };

        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => usePackageRepository('mypkg'));
        await waitFor(() => expect(result.current).toBe(mockData.repository));
    });

    it('Returns null on fetch failure (non-ok response)', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        });

        const { result } = renderHook(() => usePackageRepository('unknownpkg'));

        // --| Use a small timeout or just wait for the spy to be called since state won't change from null
        await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

        expect(result.current).toBeNull();
        consoleSpy.mockRestore();
    });

    it('Returns null and logs error on network failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => usePackageRepository('failpkg'));
        await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Error fetching package repository:', expect.any(Error)));

        expect(result.current).toBeNull();
        consoleSpy.mockRestore();
    });
});
