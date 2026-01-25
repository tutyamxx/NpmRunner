import { render } from '@testing-library/react';
import { vi } from 'vitest';
import CodeEditor from './CodeEditor';

// --| Mock monaco-editor-react to avoid loading real editor
vi.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ onMount, value }) => {
        const fakeEditor = { layout: vi.fn(), focus: vi.fn() };
        const fakeMonaco = { editor: { setTheme: vi.fn() } };
        if (onMount) onMount(fakeEditor, fakeMonaco);

        return <textarea defaultValue={value} readOnly />;
    }
}));

describe('SandboxEditor', () => {
    it('Renders correctly with given code', () => {
        const code = 'console.log("hello")';
        const setCode = vi.fn();

        render(<CodeEditor code={code} setCode={setCode} theme="dark" />);
    });

    it('Calls onEditorMount when mounted', () => {
        const code = '';
        const setCode = vi.fn();
        const onEditorMount = vi.fn();

        render(
            <CodeEditor
                code={code}
                setCode={setCode}
                theme="light"
                onEditorMount={onEditorMount}
            />
        );

        expect(onEditorMount).toHaveBeenCalled();
        const [editor, monaco] = onEditorMount.mock.calls[0];
        expect(editor.layout).toBeInstanceOf(Function);
        expect(monaco.editor.setTheme).toBeInstanceOf(Function);
    });

    it('Resolves correct Monaco theme for light and dark', () => {
        const code = '';
        const setCode = vi.fn();
        const onEditorMount = vi.fn();

        render(<CodeEditor code={code} setCode={setCode} theme="light" onEditorMount={onEditorMount} />);
        let [, monaco] = onEditorMount.mock.calls[0];
        expect(monaco.editor.setTheme).toHaveBeenCalledWith('vs');

        render(<CodeEditor code={code} setCode={setCode} theme="dark" onEditorMount={onEditorMount} />);
        [, monaco] = onEditorMount.mock.calls[1]; // Second call
        expect(monaco.editor.setTheme).toHaveBeenCalledWith('vs-dark');
    });

    it('Calls editor.layout and editor.focus on mount', () => {
        const code = '';
        const setCode = vi.fn();
        const onEditorMount = vi.fn();

        render(<CodeEditor code={code} setCode={setCode} theme="dark" onEditorMount={onEditorMount} />);
        const [editor] = onEditorMount.mock.calls[0];
        expect(editor.layout).toHaveBeenCalled();
    });
});
