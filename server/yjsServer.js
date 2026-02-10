const WebSocket = require('ws');
const Y = require('yjs');

const docs = new Map();

const MSG_SYNC_REQUEST = 0;
const MSG_SYNC_RESPONSE = 1;
const MSG_UPDATE = 2;
const MSG_AWARENESS = 3;

function getYDoc(roomCode) {
  if (!docs.has(roomCode)) {
    const doc = new Y.Doc();
    const clients = new Set();
    const awareness = new Map();
    
    docs.set(roomCode, { doc, clients, awareness });
  }
  return docs.get(roomCode);
}

function setupYjsServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url && request.url.startsWith('/yjs/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    const urlParts = req.url.replace('/yjs/', '').split('?');
    const roomCode = urlParts[0];
    console.log(`Yjs connection for room: ${roomCode}`);

    const { doc, clients, awareness } = getYDoc(roomCode);
    clients.add(ws);
    ws.roomCode = roomCode;

    const stateVector = Y.encodeStateVector(doc);
    const fullState = Y.encodeStateAsUpdate(doc);
    
    const syncMsg = JSON.stringify({
      type: MSG_SYNC_RESPONSE,
      state: Array.from(fullState)
    });
    ws.send(syncMsg);

    if (awareness.size > 0) {
      const awarenessMsg = JSON.stringify({
        type: MSG_AWARENESS,
        states: Object.fromEntries(awareness)
      });
      ws.send(awarenessMsg);
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case MSG_SYNC_REQUEST: {
            const fullState = Y.encodeStateAsUpdate(doc);
            ws.send(JSON.stringify({
              type: MSG_SYNC_RESPONSE,
              state: Array.from(fullState)
            }));
            break;
          }
          
          case MSG_UPDATE: {
            if (data.update) {
              const update = new Uint8Array(data.update);
              Y.applyUpdate(doc, update);
              
              clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: MSG_UPDATE,
                    update: data.update
                  }));
                }
              });
            }
            break;
          }
          
          case MSG_AWARENESS: {
            if (data.playerId && data.state) {
              ws.playerIdForAwareness = data.playerId;
              awareness.set(data.playerId, data.state);
              
              clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: MSG_AWARENESS,
                    playerId: data.playerId,
                    state: data.state
                  }));
                }
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('Yjs message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);

      if (ws.playerIdForAwareness) {
        awareness.delete(ws.playerIdForAwareness);
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: MSG_AWARENESS,
              playerId: ws.playerIdForAwareness,
              state: null
            }));
          }
        });
      }
      
      if (clients.size === 0) {
        setTimeout(() => {
          const docData = docs.get(roomCode);
          if (docData && docData.clients.size === 0) {
            docData.doc.destroy();
            docs.delete(roomCode);
            console.log(`Cleaned up Yjs doc for room: ${roomCode}`);
          }
        }, 30000);
      }
    });

    ws.on('error', (err) => {
      console.error('Yjs WebSocket error:', err);
    });
  });

  console.log('[YJS] WebSocket server ready');
  return wss;
}

function initializeRoomCode(roomCode, initialCode) {
  const { doc } = getYDoc(roomCode);
  const yText = doc.getText('code');
  doc.transact(() => {
    if (yText.length > 0) {
      yText.delete(0, yText.length);
    }
    if (initialCode) {
      yText.insert(0, initialCode);
    }
  });
  console.log(`Initialized Yjs doc for room ${roomCode} (${initialCode?.length || 0} chars)`);
}

function getCurrentCode(roomCode) {
  if (!docs.has(roomCode)) {
    return null;
  }
  const { doc } = docs.get(roomCode);
  const yText = doc.getText('code');
  return yText.toString();
}

function cleanupRoom(roomCode) {
  if (docs.has(roomCode)) {
    const { doc } = docs.get(roomCode);
    doc.destroy();
    docs.delete(roomCode);
    console.log(`Cleaned up Yjs doc for room: ${roomCode}`);
  }
}

module.exports = {
  setupYjsServer,
  getYDoc,
  initializeRoomCode,
  getCurrentCode,
  cleanupRoom
};
