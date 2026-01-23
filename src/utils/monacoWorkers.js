self.MonacoEnvironment = {
    getWorker(_, label) {
        const worker = label === 'typescript' || label === 'javascript'
            ? 'monaco-editor/esm/vs/language/typescript/ts.worker'
            : 'monaco-editor/esm/vs/editor/editor.worker';

        return new Worker(new URL(worker, import.meta.url), { type: 'module' });
    }
};
