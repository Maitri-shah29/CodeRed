import React, { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import FileTree from '../components/FileTree';

export default function EditorTest() {
  const [files, setFiles] = useState([
    {
      id: 'file-1',
      name: 'main.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello World!</h1>
  <div id="app"></div>
  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'file-2',
      name: 'styles.css',
      language: 'css',
      content: `body {
  margin: 0;
  padding: 20px;
  font-family: Arial, sans-serif;
  background: #f0f0f0;
}

h1 {
  color: #333;
  text-align: center;
}`
    },
    {
      id: 'file-3',
      name: 'script.js',
      language: 'javascript',
      content: `function greet(name) {
  return 'Hello, ' + name;
}

console.log(greet('World'));`
    }
  ]);
  
  const [activeFile, setActiveFile] = useState(files[0]);

  const handleFileChange = (fileId, newContent) => {
    setFiles(prevFiles =>
      prevFiles.map(f => f.id === fileId ? { ...f, content: newContent } : f)
    );
    
    if (activeFile?.id === fileId) {
      setActiveFile(prev => ({ ...prev, content: newContent }));
    }
  };

  const handleFileSelect = (file) => {
    setActiveFile(file);
  };

  const handleAddFile = () => {
    const fileName = prompt('Enter file name (e.g., utils.js, styles.css):');
    if (!fileName) return;

    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown'
    };
    const language = languageMap[ext] || 'javascript';

    const newFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      language: language,
      content: ''
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  };

  const handleDeleteFile = (file) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    if (files.length <= 1) {
      alert('Cannot delete the last file!');
      return;
    }

    setFiles(prev => prev.filter(f => f.id !== file.id));
    
    if (activeFile?.id === file.id) {
      const remaining = files.filter(f => f.id !== file.id);
      setActiveFile(remaining[0]);
    }
  };

  return (
    <div style={{ 
      padding: 0, 
      height: '100vh', 
      display: 'flex',
      gap: '20px',
      backgroundColor: '#f3f4f6',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '200px', padding: '20px' }}>
        <FileTree
          files={files}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          canEdit={true}
        />
      </div>
      <div style={{ flex: 1, padding: '20px 20px 20px 0' }}>
        <CodeEditor
          files={files}
          activeFile={activeFile}
          onFileChange={handleFileChange}
          onFileSelect={handleFileSelect}
          locked={false}
          canEdit={true}
          showTabs={true}
          height="calc(100vh - 40px)"
        />
      </div>
    </div>
  );
}
