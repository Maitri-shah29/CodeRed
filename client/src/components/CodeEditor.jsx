// CodeEditor component - Multi-file support with tabs
import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ 
  files = [],
  activeFile,
  onFileChange,
  onFileSelect,
  locked = false,
  canEdit = true,
  showTabs = true,
  height = '720px'
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleEditorChange = (value) => {
    if (!activeFile || locked || !canEdit) return;
    
    if (onFileChange) {
      onFileChange(activeFile.id, value);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'html': '📄',
      'css': '🎨',
      'js': '📜',
      'json': '📋',
      'md': '📝'
    };
    return iconMap[ext] || '📄';
  };

  if (!activeFile) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📂</div>
          <div style={styles.emptyText}>No file selected</div>
          <div style={styles.emptySubtext}>Select a file from the file tree to start editing</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {showTabs && files.length > 0 && (
        <div style={styles.tabBar}>
          {files.map(file => {
            const isActive = activeFile?.id === file.id;
            return (
              <div
                key={file.id}
                style={{
                  ...styles.tab,
                  ...(isActive ? styles.tabActive : {})
                }}
                onClick={() => onFileSelect && onFileSelect(file)}
              >
                <span style={styles.tabIcon}>{getFileIcon(file.name)}</span>
                <span style={{
                  ...styles.tabName,
                  color: isActive ? '#00ff88' : '#999'
                }}>{file.name}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ ...styles.editorWrapper, height }}>
        <Editor
          key={activeFile.id}
          path={activeFile.name}
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            readOnly: locked,
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
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '8px',
    backgroundColor: '#1f2937',
    borderBottom: '1px solid #374151',
    overflowX: 'auto'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    backgroundColor: '#374151',
    boxShadow: '0 0 8px rgba(0, 255, 136, 0.3)'
  },
  tabIcon: {
    fontSize: '14px'
  },
  tabName: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#00ff88'
  },
  editorWrapper: {
    backgroundColor: '#1e1e1e',
    flex: 1,
    minHeight: 0
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#666',
    backgroundColor: '#1e1e1e'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#00ff88'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999'
  }
};

export default CodeEditor;
