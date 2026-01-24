// --| Configure Monaco Editor to use the correct web workers for JS/TS and general editing
self.MonacoEnvironment = {
    /**
     * Returns the appropriate Worker instance for a given language label.
     *
     * @param {string} moduleId - Module identifier
     * @param {string} label - Language label, e.g., 'javascript', 'typescript'
     * @returns {Worker} A web worker instance
     */
    getWorker: (_moduleId, label) => {
        // --| Determine the worker script based on language
        const workerScript =
            label === 'typescript' || label === 'javascript'
                ? 'monaco-editor/esm/vs/language/typescript/ts.worker'
                : 'monaco-editor/esm/vs/editor/editor.worker';

        // --| Create a new worker using the module URL
        return new Worker(new URL(workerScript, import.meta.url), { type: 'module' });
    }
};
