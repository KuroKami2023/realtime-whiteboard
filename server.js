const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));

const MAX_HISTORY = 200;
const roomData = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    rooms.forEach(r => socket.leave(r));

    socket.join(roomId);
    socket.currentRoom = roomId;

    if (!roomData.has(roomId)) {
      roomData.set(roomId, {
        draws: [],
        cursors: new Map()
      });
    }

    const data = roomData.get(roomId);
    socket.emit('room-state', {
      draws: data.draws.slice(-MAX_HISTORY),
      users: data.cursors.size
    });

    io.to(roomId).emit('user-count', data.cursors.size + 1);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on('draw', (drawData) => {
    const room = socket.currentRoom;
    if (!room || !roomData.has(room)) return;
    const data = roomData.get(room);
    data.draws.push(drawData);
    if (data.draws.length > MAX_HISTORY) {
      data.draws.splice(0, data.draws.length - MAX_HISTORY);
    }
    socket.to(room).emit('draw', drawData);
  });

  socket.on('cursor', (cursorData) => {
    const room = socket.currentRoom;
    if (!room || !roomData.has(room)) return;
    const data = roomData.get(room);
    data.cursors.set(socket.id, { ...cursorData, id: socket.id });
    const others = Array.from(data.cursors.entries())
      .filter(([id]) => id !== socket.id)
      .map(([id, c]) => c);
    socket.to(room).emit('cursors', others);
  });

  socket.on('undo', () => {
    const room = socket.currentRoom;
    if (!room || !roomData.has(room)) return;
    const data = roomData.get(room);
    if (data.draws.length === 0) return;
    const removed = data.draws.pop();
    socket.to(room).emit('undo', removed);
    socket.emit('undo-ack');
  });

  socket.on('clear-board', () => {
    const room = socket.currentRoom;
    if (!room || !roomData.has(room)) return;
    const data = roomData.get(room);
    data.draws = [];
    io.to(room).emit('board-cleared');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, data] of roomData.entries()) {
      if (data.cursors.has(socket.id)) {
        data.cursors.delete(socket.id);
        io.to(roomId).emit('user-count', data.cursors.size);
        io.to(roomId).emit('cursors', Array.from(data.cursors.values()));
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
