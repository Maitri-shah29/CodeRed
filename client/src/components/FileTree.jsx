// FileTree component for file navigation
import React from 'react';

function FileTree({ files, activeFile, onFileSelect, onAddFile, onDeleteFile, canEdit = true }) {
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Files</h3>
        {canEdit && (
          <button onClick={onAddFile} style={styles.addButton} title="Add new file">
            +
          </button>
        )}
      </div>
      <div style={styles.fileList}>
        {files.map(file => {
          const isActive = activeFile?.id === file.id;
          return (
            <div
              key={file.id}
              style={{
                ...styles.fileItem,
                ...(isActive ? styles.fileItemActive : {})
              }}
              onClick={() => onFileSelect(file)}
            >
              <span style={styles.fileIcon}>{getFileIcon(file.name)}</span>
              <span style={{
                ...styles.fileName,
                color: isActive ? '#00ff88' : '#999'
              }}>{file.name}</span>
              {canEdit && files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file);
                  }}
                  style={styles.deleteButton}
                  title="Delete file"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #374151'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  title: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  addButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '1px solid #00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
    transition: 'all 0.2s'
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    backgroundColor: 'transparent'
  },
  fileItemActive: {
    backgroundColor: '#374151',
    borderLeft: '3px solid #00ff88'
  },
  fileIcon: {
    fontSize: '14px'
  },
  fileName: {
    flex: 1,
    fontSize: '12px',
    color: '#999',
    fontWeight: '500'
  },
  deleteButton: {
    width: '18px',
    height: '18px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
    transition: 'color 0.2s'
  }
};

export default FileTree;
