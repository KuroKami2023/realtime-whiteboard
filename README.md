# 🎨 Realtime Whiteboard — Collaborative Drawing App

[]()
[](LICENSE)
[]()
A real-time collaborative whiteboard where multiple users can draw simultaneously in shared rooms. Built with **Node.js**, **Express**, **Socket.io**, and the **HTML5 Canvas API**. Features live cursor tracking, undo/redo, and room-based collaboration.

---

> 💡 **Portfolio demo:** A simplified browser-based version is available in the [portfolio website](https://kurokami2023.github.io).

---

## ✨ Features

- ✅ **Real-Time Drawing** — Broadcast strokes to all room participants via WebSockets
- ✅ **Room-Based Collaboration** — Join any room by ID; each room has isolated state
- ✅ **Live Cursor Tracking** — See other users' cursors in real time with color
- ✅ **Brush Controls** — Color picker + adjustable brush size (1–30px)
- ✅ **Undo** — Per-client undo stack (also broadcast undo to sync with others)
- ✅ **Clear Board** — Wipe the entire canvas for all room members
- ✅ **Touch Support** — Works on mobile and tablet devices
- ✅ **Auto-Resize Canvas** — Adapts to window size on load and resize
- ✅ **Late Joiner Sync** — New participants receive the last 200 strokes
- ✅ **User Count** — Live indicator showing how many users are in the room
- ✅ **Responsive Toolbar** — Collapsible layout works on all screen sizes

---

```
┌─────────────────────────────────────────────────┐
│ [Room: default____] [Join] | [Color: ■] [Size: ═══] [Undo] [Clear] | [3 users] │
├─────────────────────────────────────────────────┤
│                                                   │
│                                                   │
│         🖌️  (user cursors visible)                │
│                                                   │
│                                                   │
│              Drawing area (Canvas)                │
│                                                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express |
| **Real-Time** | Socket.io (WebSocket) |
| **Frontend** | Vanilla JavaScript |
| **Drawing** | HTML5 Canvas API |
| **Styling** | CSS3 (flexbox, responsive) |

---

## 🚀 Live Demo

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in your browser
# http://localhost:3000

# 4. Open multiple tabs with the same room ID to test collaboration
```

---

## 📁 Project Structure

```
realtime-whiteboard/
├── server.js              # Express + Socket.io server
├── package.json           # Dependencies (express, socket.io)
├── public/
│   ├── index.html         # Whiteboard UI
│   ├── app.js             # Client-side drawing and Socket.io logic
│   └── styles.css         # Toolbar and canvas styling
├── LICENSE                # MIT License
└── README.md              # This file
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/KuroKami2023/realtime-whiteboard.git
cd realtime-whiteboard

# 2. Install dependencies
npm install

# 3. Start in development mode
npm run dev

# 4. Open http://localhost:3000
```

---

## 📖 Usage Guide

### Joining a Room
1. Enter a room ID in the input field (default: `default`)
2. Click **Join** or press **Enter**
3. Share the room ID with collaborators

### Drawing
- **Mouse**: Click and drag to draw
- **Touch**: Touch and drag on mobile devices
- **Color**: Select from the color picker
- **Brush Size**: Adjust with the range slider (1–30px)

### Collaborating
- All strokes appear in real time for everyone in the room
- Other users' cursors show as colored dots
- The user count updates as people join/leave

### Undo & Clear
- **Undo**: Reverts your last stroke (also instructs other clients to undo)
- **Clear**: Wipes the entire board for all users (requires confirmation)

---

## 🏗️ Architecture Overview

```
┌──────────────┐     WebSocket      ┌──────────────────┐
│  Client A     │◄─────────────────►│                  │
│  (Canvas)     │                   │   Express Server │
│               │                   │   + Socket.io    │
│  Client B     │◄─────────────────►│                  │
│  (Canvas)     │                   │  Room Data Store │
│               │                   │  ┌────────────┐  │
│  Client C     │◄─────────────────►│  │ draws[]    │  │
│  (Canvas)     │                   │  │ cursors{}  │  │
└──────────────┘                   │  └────────────┘  │
                                    └──────────────────┘
```

### Data Flow

1. User draws on canvas → `mousedown`/`mousemove`/`mouseup` events
2. Stroke data (`x0`, `y0`, `x1`, `y1`, `color`, `size`, `time`) emitted via `socket.emit('draw', data)`
3. Server receives draw event → pushes to room's `draws[]` array → broadcasts to all other clients in room
4. Other clients receive `socket.on('draw', data)` → render stroke on their canvas

### State Management
- **Server**: Maintains `Map<roomId, { draws, cursors }>` — last 200 strokes per room
- **Client**: Maintains an `undoStack` of canvas snapshots for local undo

---

## 📡 WebSocket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client → Server | `roomId` | Join a drawing room |
| `room-state` | Server → Client | `{ draws, users }` | Full state for late joiners |
| `draw` | Bidirectional | `{ x0, y0, x1, y1, color, size, time }` | Stroke data |
| `cursor` | Client → Server | `{ x, y, color, name }` | Cursor position |
| `cursors` | Server → Client | `[{ x, y, color, id }]` | All other cursors |
| `undo` | Bidirectional | — | Undo last stroke |
| `undo-ack` | Server → Client | — | Undo acknowledged |
| `clear-board` | Client → Server | — | Clear entire board |
| `board-cleared` | Server → Room | — | Board cleared broadcast |
| `user-count` | Server → Client | `count` | Active users in room |

---

---


## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ by <a href="https://github.com/KuroKami2023">KuroKami2023</a></p>
