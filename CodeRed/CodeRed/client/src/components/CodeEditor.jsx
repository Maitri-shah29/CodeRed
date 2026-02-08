// CodeEditor component
import React from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ 
  code, 
  onChange, 
  readOnly = false, 
  language = 'javascript',
  height = '400px'
}) {
  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.editorHeader}>
        <span style={styles.editorTitle}>Code Editor</span>
        <span style={styles.language}>{language}</span>
      </div>
      <div style={styles.editorWrapper}>
        <Editor
          height={height}
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#1f2937',
    color: 'white'
  },
  editorTitle: {
    fontSize: '14px',
    fontWeight: '600'
  },
  language: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#374151',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  editorWrapper: {
    backgroundColor: '#1e1e1e'
  }
};

export default CodeEditor;
