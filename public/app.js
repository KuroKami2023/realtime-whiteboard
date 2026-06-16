(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const roomInput = document.getElementById('roomInput');
  const joinBtn = document.getElementById('joinBtn');
  const userCountEl = document.getElementById('userCount');
  const colorPicker = document.getElementById('colorPicker');
  const brushSize = document.getElementById('brushSize');
  const brushSizeDisplay = document.getElementById('brushSizeDisplay');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');

  const socket = io();

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentRoom = 'default';

  let undoStack = [];
  let redoStack = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - canvas.offsetTop;
    redrawAll();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    const drawData = {
      x0: lastX, y0: lastY,
      x1: pos.x, y1: pos.y,
      color: colorPicker.value,
      size: parseInt(brushSize.value),
      time: Date.now()
    };
    drawStroke(drawData);
    socket.emit('draw', drawData);
    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing(e) {
    if (isDrawing) {
      isDrawing = false;
      undoStack.push({ type: 'snapshot', data: getImageData() });
      redoStack = [];
    }
  }

  function drawStroke(data) {
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function getImageData() {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function putImageData(data) {
    ctx.putImageData(data, 0, 0);
  }

  function redrawAll() {
    if (undoStack.length > 0) {
      const snapshot = undoStack[undoStack.length - 1];
      if (snapshot.type === 'snapshot') {
        putImageData(snapshot.data);
      }
    }
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing, { passive: false });

  colorPicker.addEventListener('input', () => {
    ctx.strokeStyle = colorPicker.value;
  });

  brushSize.addEventListener('input', () => {
    brushSizeDisplay.textContent = brushSize.value;
    ctx.lineWidth = parseInt(brushSize.value);
  });

  brushSizeDisplay.textContent = brushSize.value;

  undoBtn.addEventListener('click', () => {
    if (undoStack.length <= 1) return;
    const last = undoStack.pop();
    redoStack.push(last);
    const prev = undoStack[undoStack.length - 1];
    if (prev && prev.type === 'snapshot') {
      putImageData(prev.data);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    socket.emit('undo');
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear the entire board?')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = [{ type: 'snapshot', data: getImageData() }];
    redoStack = [];
    socket.emit('clear-board');
  });

  joinBtn.addEventListener('click', () => {
    const room = roomInput.value.trim() || 'default';
    if (room === currentRoom) return;
    currentRoom = room;
    socket.emit('join-room', room);
  });

  roomInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  socket.on('connect', () => {
    socket.emit('join-room', currentRoom);
  });

  socket.on('room-state', (state) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = [{ type: 'snapshot', data: getImageData() }];
    redoStack = [];

    state.draws.forEach(d => drawStroke(d));

    if (state.draws.length > 0) {
      undoStack.push({ type: 'snapshot', data: getImageData() });
    }

    if (state.users !== undefined) {
      userCountEl.textContent = `${state.users} user${state.users !== 1 ? 's' : ''}`;
    }

    document.title = `Whiteboard - Room: ${currentRoom}`;
  });

  socket.on('draw', (data) => {
    drawStroke(data);
  });

  socket.on('undo', () => {
    if (undoStack.length <= 1) return;
    undoStack.pop();
    const prev = undoStack[undoStack.length - 1];
    if (prev && prev.type === 'snapshot') {
      putImageData(prev.data);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  socket.on('board-cleared', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = [{ type: 'snapshot', data: getImageData() }];
    redoStack = [];
  });

  socket.on('user-count', (count) => {
    userCountEl.textContent = `${count} user${count !== 1 ? 's' : ''}`;
  });

  let cursorInterval = null;
  let lastCursorSend = 0;

  canvas.addEventListener('mousemove', (e) => {
    if (Date.now() - lastCursorSend < 50) return;
    lastCursorSend = Date.now();
    const pos = getPos(e);
    socket.emit('cursor', {
      x: pos.x,
      y: pos.y,
      color: colorPicker.value,
      name: `User`
    });
  });

  if (cursorInterval) clearInterval(cursorInterval);
  cursorInterval = setInterval(() => {
    socket.emit('cursor', { x: -100, y: -100, color: '#000', name: '' });
  }, 3000);
})();
