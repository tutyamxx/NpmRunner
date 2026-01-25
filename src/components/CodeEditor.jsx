import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';

/**
 * Reusable Monaco Editor component for sandboxed code editing
 *
 * Props:
 * - code: string (controlled value)
 * - setCode: function (updates code)
 * - theme: 'light' | 'dark'
 * - onEditorMount: optional callback to get editor instance
 */
const CodeEditor = ({ code, setCode, theme = 'dark', onEditorMount }) => {
    const containerRef = useRef(null);

    return (
        <div className="runner-editor" ref={containerRef} style={{ height: '100%' }}>
            <Editor
                data-testid="monaco-editor"
                height="100%"
                defaultLanguage='javascript'
                language='javascript'
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                value={code ?? ''}
                onChange={(value) => setCode(value ?? '')}
                onMount={(editor, monaco) => {
                    if (onEditorMount) {
                        onEditorMount(editor, monaco);
                    }

                    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
                    editor.layout();
                }}
                options={{
                    automaticLayout: true,
                    contextmenu: true,
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
                }}
            />
        </div>
    );
};

CodeEditor.propTypes = {
    code: PropTypes.string.isRequired,
    setCode: PropTypes.func.isRequired,
    theme: PropTypes.oneOf(['light', 'dark']),
    onEditorMount: PropTypes.func
};

export default CodeEditor;
