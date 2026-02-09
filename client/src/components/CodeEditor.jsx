// CodeEditor component with simplified Yjs CRDT collaborative editing
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
const WS_URL = SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://');

// Message types (must match server)
const MSG_SYNC_REQUEST = 0;
const MSG_SYNC_RESPONSE = 1;
const MSG_UPDATE = 2;
const MSG_AWARENESS = 3;

function CodeEditor({ 
  code, 
  onChange, 
  readOnly = false, 
  language = 'javascript',
  height = '720px',
  roomCode = null,
  playerId = null,
  playerName = 'Anonymous',
  playerColor = '#00ff88'
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const wsRef = useRef(null);
  const yTextRef = useRef(null);
  const isLocalChangeRef = useRef(false);
  const initialCodeRef = useRef(code); // Store initial code
  
  const [locked, setLocked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});

  // Update editor content from Yjs
  const updateEditorContent = useCallback(() => {
    if (editorRef.current && yTextRef.current) {
      const newContent = yTextRef.current.toString();
      const currentContent = editorRef.current.getValue();
      
      if (newContent !== currentContent) {
        isLocalChangeRef.current = true;
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(newContent);
        if (position) {
          editorRef.current.setPosition(position);
        }
        isLocalChangeRef.current = false;
        
        if (onChange) {
          onChange(newContent);
        }
      }
    }
  }, [onChange]);

  // Setup WebSocket connection for Yjs - only depends on roomCode, playerId, playerName, playerColor
  useEffect(() => {
    if (!roomCode) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const yText = ydoc.getText('code');
    yTextRef.current = yText;

    // Initialize with code if provided
    if (initialCodeRef.current && yText.length === 0) {
      yText.insert(0, initialCodeRef.current);
    }

    const wsUrl = `${WS_URL}/yjs/${roomCode}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Yjs WebSocket connected');
      setConnected(true);
      
      // Request initial sync
      ws.send(JSON.stringify({ type: MSG_SYNC_REQUEST }));
      
      // Send awareness
      if (playerId) {
        ws.send(JSON.stringify({
          type: MSG_AWARENESS,
          playerId,
          state: { name: playerName, color: playerColor }
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case MSG_SYNC_RESPONSE:
            if (data.state) {
              const update = new Uint8Array(data.state);
              Y.applyUpdate(ydoc, update);
              // Update editor after applying sync
              if (editorRef.current && yTextRef.current) {
                const newContent = yTextRef.current.toString();
                if (newContent && editorRef.current.getValue() !== newContent) {
                  isLocalChangeRef.current = true;
                  editorRef.current.setValue(newContent);
                  isLocalChangeRef.current = false;
                }
              }
            }
            break;
          
          case MSG_UPDATE:
            if (data.update) {
              const update = new Uint8Array(data.update);
              Y.applyUpdate(ydoc, update);
              // Update editor after applying update
              if (editorRef.current && yTextRef.current) {
                const newContent = yTextRef.current.toString();
                if (editorRef.current.getValue() !== newContent) {
                  isLocalChangeRef.current = true;
                  const position = editorRef.current.getPosition();
                  editorRef.current.setValue(newContent);
                  if (position) editorRef.current.setPosition(position);
                  isLocalChangeRef.current = false;
                }
              }
            }
            break;
          
          case MSG_AWARENESS:
            if (data.playerId && data.playerId !== playerId) {
              setRemoteCursors(prev => ({
                ...prev,
                [data.playerId]: data.state
              }));
            } else if (data.states) {
              const filtered = Object.fromEntries(
                Object.entries(data.states).filter(([id]) => id !== playerId)
              );
              setRemoteCursors(filtered);
            }
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error('Yjs message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('Yjs WebSocket disconnected');
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('Yjs WebSocket error:', err);
      setConnected(false);
    };

    // Listen for local document changes
    const updateHandler = (update, origin) => {
      if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: MSG_UPDATE,
          update: Array.from(update)
        }));
      }
    };
    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
      ws.close();
      ydoc.destroy();
    };
  }, [roomCode, playerId, playerName, playerColor]); // Removed code and updateEditorContent

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set initial content from Yjs if available
    if (yTextRef.current && yTextRef.current.length > 0) {
      editor.setValue(yTextRef.current.toString());
    }
  };

  const handleEditorChange = (value) => {
    if (locked || isLocalChangeRef.current) return;
    
    if (yTextRef.current && ydocRef.current) {
      const currentContent = yTextRef.current.toString();
      if (value !== currentContent) {
        ydocRef.current.transact(() => {
          yTextRef.current.delete(0, yTextRef.current.length);
          yTextRef.current.insert(0, value);
        });
      }
    }
    
    if (onChange) {
      onChange(value);
    }
  };

  // Add decoration styles
  useEffect(() => {
    if (!document.getElementById('code-editor-decor')) {
      const style = document.createElement('style');
      style.id = 'code-editor-decor';
      style.innerHTML = `
        .myErrorLine { background: rgba(239,68,68,0.08); border-left: 4px solid rgba(239,68,68,0.6); }
        .myWarnLine { background: rgba(245,158,11,0.04); border-left: 4px solid rgba(245,158,11,0.5); }
        .myInfoLine { background: rgba(59,130,246,0.04); border-left: 4px solid rgba(59,130,246,0.5); }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const validateRemote = async () => {
    const currentCode = yTextRef.current 
      ? yTextRef.current.toString() 
      : (editorRef.current ? editorRef.current.getValue() : '');
    
    try {
      const res = await fetch(`${SERVER_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode })
      });
      const json = await res.json();
      console.log('Validation result:', json);
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

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
    editorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      backgroundColor: '#1f2937',
      color: 'white',
      borderBottom: '1px solid #374151'
    },
    editorTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#00ff88'
    },
    language: {
      fontSize: '10px',
      padding: '3px 6px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      textTransform: 'uppercase',
      color: '#999'
    },
    connectionStatus: {
      fontSize: '10px',
      padding: '3px 8px',
      borderRadius: '4px',
      backgroundColor: connected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)',
      color: connected ? '#00ff88' : '#ff3366',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    btn: {
      padding: '4px 10px',
      fontSize: '10px',
      background: 'rgba(0,255,136,0.1)',
      border: '1px solid #00ff88',
      color: '#00ff88',
      borderRadius: '4px',
      cursor: 'pointer',
      fontFamily: 'inherit'
    },
    editorWrapper: {
      backgroundColor: '#1e1e1e',
      flex: 1,
      minHeight: 0
    },
    remoteCursorsInfo: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    cursorBadge: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.editorHeader}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={styles.editorTitle}>Code Editor</span>
          <span style={styles.language}>{language}</span>
          {roomCode && (
            <span style={styles.connectionStatus}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                backgroundColor: connected ? '#00ff88' : '#ff3366' 
              }}></span>
              {connected ? 'LIVE' : 'CONNECTING...'}
            </span>
          )}
          {!readOnly && (
            <>
              <button onClick={() => { setLocked(s => !s); }} style={styles.btn}>
                {locked ? 'Unlock' : 'Lock'}
              </button>
              <button onClick={validateRemote} style={styles.btn}>Validate</button>
            </>
          )}
        </div>
        <div style={styles.remoteCursorsInfo}>
          {Object.entries(remoteCursors).map(([id, state]) => (
            <span 
              key={id} 
              style={{
                ...styles.cursorBadge,
                backgroundColor: `${state.color}33`,
                color: state.color
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: state.color
              }}></span>
              {state.name}
            </span>
          ))}
        </div>
      </div>
      <div style={styles.editorWrapper}>
        <Editor
          height={'100%'}
          language={language}
          defaultValue={code}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            readOnly: readOnly || locked,
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

export default CodeEditor;
