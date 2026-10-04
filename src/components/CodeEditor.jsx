import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';

// --| Default editor options for all instances of the Monaco Editor
const EDITOR_OPTIONS = {
    automaticLayout: true,
    contextmenu: false,
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    wrappingIndent: 'indent',
    occurrencesHighlight: true,
    useShadows: true,
    quickSuggestions: { other: true, comments: false, strings: true },
    quickSuggestionsDelay: 100,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'smart',
    tabCompletion: 'on',
    wordBasedSuggestions: true,
    parameterHints: true,
    snippetSuggestions: 'inline'
};

// --| Wrapper props for the Monaco Editor component
const WRAPPER_PROPS = { 'data-testid': 'monaco-editor' };

/**
 * Reusable Monaco Editor component for sandboxed code editing
 *
 * Props:
 * - code: string (controlled value)
 * - setCode: function (updates code)
 * - theme: 'light' | 'dark'
 * - onEditorMount: optional callback to get editor instance
 */
const CodeEditor = ({ code, setCode, theme = 'dark', onEditorMount }) => (
    <Editor
        wrapperProps={WRAPPER_PROPS}
        height="100%"
        language="javascript"
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        value={code ?? ''}
        loading={null}
        options={EDITOR_OPTIONS}
        onChange={(value) => setCode(value ?? '')}
        onMount={onEditorMount}
    />
);

CodeEditor.propTypes = {
    code: PropTypes.string.isRequired,
    setCode: PropTypes.func.isRequired,
    theme: PropTypes.oneOf(['light', 'dark']),
    onEditorMount: PropTypes.func
};

export default CodeEditor;
