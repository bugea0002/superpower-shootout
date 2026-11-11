import { WebSocketServer, WebSocket } from 'ws';

interface Player {
  ws: WebSocket;
  role: 'p1' | 'p2';
}

interface Room {
  id: string;
  players: Player[];
}

const PORT = 5174;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map<string, Room>();

console.log(`[Multiplayer] WebSocket Server running on ws://0.0.0.0:${PORT}`);

wss.on('connection', (ws) => {
  let currentRoomId: string | null = null;
  let currentRole: 'p1' | 'p2' | null = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'join_room') {
        const roomId = (msg.roomId || '1004').toString().trim().toUpperCase();
        let room = rooms.get(roomId);

        if (!room) {
          room = { id: roomId, players: [] };
          rooms.set(roomId, room);
        }

        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: '방이 이미 가득 찼습니다! (최대 2명)' }));
          return;
        }

        const role: 'p1' | 'p2' = room.players.length === 0 ? 'p1' : 'p2';
        currentRoomId = roomId;
        currentRole = role;
        room.players.push({ ws, role });

        ws.send(JSON.stringify({ type: 'joined', roomId, role }));

        if (room.players.length === 2) {
          // Both connected! Notify start
          room.players.forEach((p) => {
            p.ws.send(JSON.stringify({ type: 'match_ready', roomId, p1: true, p2: true }));
          });
          console.log(`[Multiplayer] Room ${roomId} is ready with 2 players!`);
        }
      } else if (msg.type === 'game_event' && currentRoomId) {
        // Forward game event to the other player in the room
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players.forEach((p) => {
            if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'game_event', event: msg.event, from: currentRole }));
            }
          });
        }
      }
    } catch (e) {
      console.error('[Multiplayer] Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter((p) => p.ws !== ws);
        if (room.players.length === 0) {
          rooms.delete(currentRoomId);
          console.log(`[Multiplayer] Room ${currentRoomId} deleted`);
        } else {
          room.players.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'opponent_left' }));
            }
          });
        }
      }
    }
  });
});
