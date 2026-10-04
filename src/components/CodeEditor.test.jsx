import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CodeEditor from './CodeEditor';

// --| Mock monaco-editor-react to avoid loading real editor
vi.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ onMount, value, onChange, theme, options }) => {
        const fakeEditor = { layout: vi.fn(), focus: vi.fn(), updateOptions: vi.fn() };
        const fakeMonaco = { editor: { setTheme: vi.fn() } };

        if (onMount) onMount(fakeEditor, fakeMonaco);

        return (
            <textarea
                defaultValue={value}
                readOnly
                data-testid="monaco-editor-mock"
                data-theme={theme}
                data-options={JSON.stringify(options)}
                onChange={(e) => onChange?.(e.target.value)}
            />
        );
    }
}));

const setup = (props = {}) => {
    const setCode = vi.fn();
    const utils = render(<CodeEditor code="" setCode={setCode} {...props} />);

    return { setCode, textarea: utils.getByTestId('monaco-editor-mock'), ...utils };
};

describe('🏖️ Code Editor', () => {
    it('Renders correctly with given code', () => {
        const { textarea } = setup({ code: 'console.log("hello")', theme: 'dark' });

        expect(textarea.defaultValue).toBe('console.log("hello")');
    });

    it('Calls onEditorMount when mounted', () => {
        const onEditorMount = vi.fn();
        setup({ theme: 'light', onEditorMount });

        expect(onEditorMount).toHaveBeenCalled();
        const [editor, monaco] = onEditorMount.mock.calls[0];
        expect(editor.layout).toBeInstanceOf(Function);
        expect(monaco.editor.setTheme).toBeInstanceOf(Function);
    });

    it.each([
        ['light', 'vs'],
        ['dark', 'vs-dark']
    ])('Resolves correct Monaco theme for %s', (theme, monacoTheme) => {
        const { textarea } = setup({ theme });

        expect(textarea.dataset.theme).toBe(monacoTheme);
    });

    it('Defaults to dark theme if no theme provided', () => {
        const { textarea } = setup();

        expect(textarea.dataset.theme).toBe('vs-dark');
    });

    it('Disables editor context menu and enables automatic layout via options', () => {
        const { textarea } = setup();
        const options = JSON.parse(textarea.dataset.options);

        expect(options.contextmenu).toBe(false);
        expect(options.automaticLayout).toBe(true);
    });

    // eslint-disable-next-line no-undefined
    it.each([null, undefined])('Renders empty string if code prop is %s', (code) => {
        const { textarea } = setup({ code });
        expect(textarea.defaultValue).toBe('');
    });

    it('Does not crash if onEditorMount is not provided', () => {
        expect(() => setup({ code: 'test', theme: 'dark' })).not.toThrow();
    });

    it('Updates Monaco theme when theme prop changes', () => {
        const { rerender, getByTestId, setCode } = setup({ theme: 'light' });
        expect(getByTestId('monaco-editor-mock').dataset.theme).toBe('vs');

        rerender(<CodeEditor code="" setCode={setCode} theme="dark" />);
        expect(getByTestId('monaco-editor-mock').dataset.theme).toBe('vs-dark');
    });

    it('Calls onChange and updates code correctly', () => {
        const { setCode, textarea } = setup();

        fireEvent.change(textarea, { target: { value: 'new code' } });
        expect(setCode).toHaveBeenCalledWith('new code');

        fireEvent.change(textarea, { target: { value: null } });
        expect(setCode).toHaveBeenCalledWith('');
    });
});
