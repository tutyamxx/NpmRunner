import { vi } from 'vitest';
import '../utils/monacoWorkers';

describe('MonacoEnvironment web worker configuration', () => {
    beforeEach(() => {
        // --| Mock global Worker so no real workers are created
        globalThis.Worker = vi.fn();
    });

    afterEach(() => vi.restoreAllMocks());

    it('Registers MonacoEnvironment on self', () => {
        expect(self.MonacoEnvironment).toBeDefined();
        expect(self.MonacoEnvironment.getWorker).toBeInstanceOf(Function);
    });

    it('Uses TypeScript worker for javascript label', () => {
        self.MonacoEnvironment.getWorker('module', 'javascript');

        expect(Worker).toHaveBeenCalledTimes(1);

        const [url, options] = Worker.mock.calls[0];

        expect(url.href).toContain('ts.worker');
        expect(options).toEqual({ type: 'module' });
    });

    it('Uses TypeScript worker for typescript label', () => {
        self.MonacoEnvironment.getWorker('module', 'typescript');

        expect(Worker).toHaveBeenCalledTimes(1);

        const [url, options] = Worker.mock.calls[0];

        expect(url.href).toContain('ts.worker');
        expect(options).toEqual({ type: 'module' });
    });

    it('Uses default editor worker for non JS/TS labels', () => {
        self.MonacoEnvironment.getWorker('module', 'json');

        expect(Worker).toHaveBeenCalledTimes(1);

        const [url, options] = Worker.mock.calls[0];

        expect(url.href).toContain('editor.worker');
        expect(options).toEqual({ type: 'module' });
    });
});
